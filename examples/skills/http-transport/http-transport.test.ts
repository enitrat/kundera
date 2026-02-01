import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import type { JsonRpcRequest } from 'kundera/transport';
import { httpTransport } from './index';

describe('http-transport skill', () => {
  let originalFetch: typeof fetch;
  let mockFetch: ReturnType<typeof mock>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockFetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: 12345 }),
      }),
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('retries on network error', async () => {
    let attempts = 0;
    mockFetch.mockImplementation(() => {
      attempts++;
      if (attempts < 2) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: 'ok' }),
      });
    });

    const transport = httpTransport('https://example.com', {
      retries: 2,
      retryDelay: 10,
    });

    const response = await transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
    });

    expect(attempts).toBe(2);
    expect((response as { result: string }).result).toBe('ok');
  });

  it('returns error after max retries', async () => {
    mockFetch.mockImplementation(() =>
      Promise.reject(new Error('Network error')),
    );

    const transport = httpTransport('https://example.com', {
      retries: 2,
      retryDelay: 10,
    });

    const response = await transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
    });

    expect('error' in response).toBe(true);
  });

  it('batches concurrent requests', async () => {
    mockFetch.mockImplementation((_, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      const isBatch = Array.isArray(body);

      if (isBatch) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              body.map((req: JsonRpcRequest) => ({
                jsonrpc: '2.0',
                id: req.id,
                result: `result-${req.id}`,
              })),
            ),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: body.id,
            result: `result-${body.id}`,
          }),
      });
    });

    const transport = httpTransport('https://example.com', {
      batch: { batchWait: 10, batchSize: 10 },
    });

    const [r1, r2, r3] = await Promise.all([
      transport.request({ jsonrpc: '2.0', id: 1, method: 'a' }),
      transport.request({ jsonrpc: '2.0', id: 2, method: 'b' }),
      transport.request({ jsonrpc: '2.0', id: 3, method: 'c' }),
    ]);

    expect((r1 as { result: string }).result).toBe('result-1');
    expect((r2 as { result: string }).result).toBe('result-2');
    expect((r3 as { result: string }).result).toBe('result-3');
  });

  it('flushes batch when size limit reached', async () => {
    let fetchCount = 0;
    mockFetch.mockImplementation((_, init) => {
      fetchCount++;
      const body = JSON.parse((init as RequestInit).body as string);
      const requests = Array.isArray(body) ? body : [body];

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            Array.isArray(body)
              ? requests.map((req: JsonRpcRequest) => ({
                  jsonrpc: '2.0',
                  id: req.id,
                  result: 'ok',
                }))
              : { jsonrpc: '2.0', id: body.id, result: 'ok' },
          ),
      });
    });

    const transport = httpTransport('https://example.com', {
      batch: { batchWait: 1000, batchSize: 2 },
    });

    await Promise.all([
      transport.request({ jsonrpc: '2.0', id: 1, method: 'a' }),
      transport.request({ jsonrpc: '2.0', id: 2, method: 'b' }),
      transport.request({ jsonrpc: '2.0', id: 3, method: 'c' }),
    ]);

    expect(fetchCount).toBe(2);
  });
});
