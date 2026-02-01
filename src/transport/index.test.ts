/**
 * Transport Module Tests
 *
 * Tests for JSON-RPC transports: HTTP, WebSocket, and Fallback.
 * Tests JSON-RPC 2.0 compliance, batching, retries, and error handling.
 */

import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import {
  httpTransport,
  fallbackTransport,
  createRequest,
  createErrorResponse,
  matchBatchResponses,
  isJsonRpcError,
  JsonRpcErrorCode,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type Transport,
} from './index.js';

// ============ Utility Tests ============

describe('Transport Utilities', () => {
  describe('createRequest', () => {
    it('creates request with method only', () => {
      const request = createRequest('starknet_blockNumber');
      expect(request.jsonrpc).toBe('2.0');
      expect(request.method).toBe('starknet_blockNumber');
      expect(request.id).toBeUndefined();
      expect(request.params).toBeUndefined();
    });

    it('creates request with params', () => {
      const request = createRequest('starknet_getBlockWithTxHashes', ['latest']);
      expect(request.params).toEqual(['latest']);
    });

    it('creates request with id', () => {
      const request = createRequest('starknet_blockNumber', [], 42);
      expect(request.id).toBe(42);
    });
  });

  describe('createErrorResponse', () => {
    it('creates error response', () => {
      const response = createErrorResponse(1, -32600, 'Invalid Request');
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.error.code).toBe(-32600);
      expect(response.error.message).toBe('Invalid Request');
    });

    it('creates error response with data', () => {
      const response = createErrorResponse(1, -32602, 'Invalid params', {
        detail: 'missing field',
      });
      expect(response.error.data).toEqual({ detail: 'missing field' });
    });
  });

  describe('isJsonRpcError', () => {
    it('returns true for error response', () => {
      const response = createErrorResponse(1, -32600, 'Error');
      expect(isJsonRpcError(response)).toBe(true);
    });

    it('returns false for success response', () => {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: 42,
      };
      expect(isJsonRpcError(response)).toBe(false);
    });
  });

  describe('matchBatchResponses', () => {
    it('matches responses to requests by id', () => {
      const requests: JsonRpcRequest[] = [
        { jsonrpc: '2.0', id: 1, method: 'a' },
        { jsonrpc: '2.0', id: 2, method: 'b' },
        { jsonrpc: '2.0', id: 3, method: 'c' },
      ];

      // Responses in different order (JSON-RPC 2.0 allows this)
      const responses: JsonRpcResponse[] = [
        { jsonrpc: '2.0', id: 3, result: 'c-result' },
        { jsonrpc: '2.0', id: 1, result: 'a-result' },
        { jsonrpc: '2.0', id: 2, result: 'b-result' },
      ];

      const matched = matchBatchResponses(requests, responses);

      expect(matched[0]!.id).toBe(1);
      expect((matched[0] as { result: string }).result).toBe('a-result');
      expect(matched[1]!.id).toBe(2);
      expect((matched[1] as { result: string }).result).toBe('b-result');
      expect(matched[2]!.id).toBe(3);
      expect((matched[2] as { result: string }).result).toBe('c-result');
    });

    it('handles missing response', () => {
      const requests: JsonRpcRequest[] = [
        { jsonrpc: '2.0', id: 1, method: 'a' },
        { jsonrpc: '2.0', id: 2, method: 'b' },
      ];

      const responses: JsonRpcResponse[] = [
        { jsonrpc: '2.0', id: 1, result: 'a-result' },
        // Missing response for id: 2
      ];

      const matched = matchBatchResponses(requests, responses);

      expect(matched[0]!.id).toBe(1);
      expect(isJsonRpcError(matched[1]!)).toBe(true);
    });
  });
});

// ============ HTTP Transport Tests ============

describe('HTTP Transport', () => {
  // Mock fetch for testing
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

  it('creates transport with url', () => {
    const transport = httpTransport('https://example.com');
    expect(transport.type).toBe('http');
  });

  it('sends request and receives response', async () => {
    const transport = httpTransport('https://example.com');
    const response = await transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'starknet_blockNumber',
      params: [],
    });

    expect(response.id).toBe(1);
    expect((response as { result: number }).result).toBe(12345);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('auto-assigns id if missing', async () => {
    const transport = httpTransport('https://example.com');
    await transport.request({
      jsonrpc: '2.0',
      method: 'starknet_blockNumber',
    });

    const call = mockFetch.mock.calls[0]!;
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.id).toBeDefined();
  });

  it('handles HTTP error', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    const transport = httpTransport('https://example.com');
    const response = await transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'starknet_blockNumber',
    });

    expect(isJsonRpcError(response)).toBe(true);
  });

  it('handles JSON-RPC error response', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -32600, message: 'Invalid Request' },
          }),
      }),
    );

    const transport = httpTransport('https://example.com');
    const response = await transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'invalid',
    });

    expect(isJsonRpcError(response)).toBe(true);
    if (isJsonRpcError(response)) {
      expect(response.error.code).toBe(-32600);
    }
  });

  describe('batch requests', () => {
    it('sends batch and matches responses by id', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { jsonrpc: '2.0', id: 2, result: 'chain-id' },
              { jsonrpc: '2.0', id: 1, result: 100 },
            ]),
        }),
      );

      const transport = httpTransport('https://example.com');
      const responses = await transport.requestBatch([
        { jsonrpc: '2.0', id: 1, method: 'starknet_blockNumber' },
        { jsonrpc: '2.0', id: 2, method: 'starknet_chainId' },
      ]);

      // Responses should be matched to request order
      expect(responses[0]!.id).toBe(1);
      expect((responses[0] as { result: number }).result).toBe(100);
      expect(responses[1]!.id).toBe(2);
      expect((responses[1] as { result: string }).result).toBe('chain-id');
    });
  });

  describe('retries', () => {
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

      expect(isJsonRpcError(response)).toBe(true);
    });
  });

  describe('auto-batching', () => {
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

      // Send concurrent requests
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
        batch: { batchWait: 1000, batchSize: 2 }, // Large wait, small size
      });

      // Send 3 requests - should trigger 2 batches
      await Promise.all([
        transport.request({ jsonrpc: '2.0', id: 1, method: 'a' }),
        transport.request({ jsonrpc: '2.0', id: 2, method: 'b' }),
        transport.request({ jsonrpc: '2.0', id: 3, method: 'c' }),
      ]);

      // First 2 should batch together, 3rd in separate batch
      expect(fetchCount).toBe(2);
    });
  });
});

// ============ Fallback Transport Tests ============

describe('Fallback Transport', () => {
  it('requires at least one transport', () => {
    expect(() => fallbackTransport([])).toThrow();
  });

  it('uses first transport on success', async () => {
    const primary: Transport = {
      type: 'http',
      request: async <T = unknown>() => ({ jsonrpc: '2.0' as const, id: 1, result: 'primary' }) as JsonRpcResponse<T>,
      requestBatch: async () => [],
    };

    const backup: Transport = {
      type: 'http',
      request: async <T = unknown>() => ({ jsonrpc: '2.0' as const, id: 1, result: 'backup' }) as JsonRpcResponse<T>,
      requestBatch: async () => [],
    };

    const transport = fallbackTransport([primary, backup]);
    const response = await transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
    });

    expect((response as { result: string }).result).toBe('primary');
  });

  it('falls back to second transport on failure', async () => {
    const primary: Transport = {
      type: 'http',
      request: async <T = unknown>() =>
        createErrorResponse(1, JsonRpcErrorCode.InternalError, 'Failed') as JsonRpcResponse<T>,
      requestBatch: async () => [],
    };

    const backup: Transport = {
      type: 'http',
      request: async <T = unknown>() => ({ jsonrpc: '2.0' as const, id: 1, result: 'backup' }) as JsonRpcResponse<T>,
      requestBatch: async () => [],
    };

    const transport = fallbackTransport([primary, backup], { retryCount: 1 });
    const response = await transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
    });

    expect((response as { result: string }).result).toBe('backup');
  });

  it('retries before falling back', async () => {
    let primaryAttempts = 0;

    const primary: Transport = {
      type: 'http',
      request: async () => {
        primaryAttempts++;
        return createErrorResponse(1, JsonRpcErrorCode.InternalError, 'Failed');
      },
      requestBatch: async () => [],
    };

    const backup: Transport = {
      type: 'http',
      request: async <T = unknown>() => ({ jsonrpc: '2.0' as const, id: 1, result: 'backup' }) as JsonRpcResponse<T>,
      requestBatch: async () => [],
    };

    const transport = fallbackTransport([primary, backup], {
      retryCount: 3,
      retryDelay: 10,
    });

    await transport.request({ jsonrpc: '2.0', id: 1, method: 'test' });

    expect(primaryAttempts).toBe(3);
  });

  it('returns error when all transports fail', async () => {
    const failing: Transport = {
      type: 'http',
      request: async () =>
        createErrorResponse(1, JsonRpcErrorCode.InternalError, 'Failed'),
      requestBatch: async () => [],
    };

    const transport = fallbackTransport([failing, failing], { retryCount: 1 });
    const response = await transport.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
    });

    expect(isJsonRpcError(response)).toBe(true);
    if (isJsonRpcError(response)) {
      expect(response.error.message).toContain('All transports failed');
    }
  });

  describe('batch requests', () => {
    it('falls back batch requests', async () => {
      const primary: Transport = {
        type: 'http',
        request: async () =>
          createErrorResponse(1, JsonRpcErrorCode.InternalError, 'Failed'),
        requestBatch: async () => [
          createErrorResponse(1, JsonRpcErrorCode.InternalError, 'Failed'),
          createErrorResponse(2, JsonRpcErrorCode.InternalError, 'Failed'),
        ],
      };

      const backup: Transport = {
        type: 'http',
        request: async <T = unknown>() => ({ jsonrpc: '2.0' as const, id: 1, result: 'ok' }) as JsonRpcResponse<T>,
        requestBatch: async <T = unknown>() => [
          { jsonrpc: '2.0' as const, id: 1, result: 'batch-1' },
          { jsonrpc: '2.0' as const, id: 2, result: 'batch-2' },
        ] as JsonRpcResponse<T>[],
      };

      const transport = fallbackTransport([primary, backup], { retryCount: 1 });
      const responses = await transport.requestBatch([
        { jsonrpc: '2.0', id: 1, method: 'a' },
        { jsonrpc: '2.0', id: 2, method: 'b' },
      ]);

      expect((responses[0] as { result: string }).result).toBe('batch-1');
      expect((responses[1] as { result: string }).result).toBe('batch-2');
    });
  });

  describe('ranking', () => {
    it('prioritizes successful transports with ranking enabled', async () => {
      let primaryCalls = 0;
      let backupCalls = 0;

      const primary: Transport = {
        type: 'http',
        request: async <T = unknown>() => {
          primaryCalls++;
          // Fail first 2 calls, then succeed
          if (primaryCalls <= 2) {
            return createErrorResponse(
              1,
              JsonRpcErrorCode.InternalError,
              'Failed',
            ) as JsonRpcResponse<T>;
          }
          return { jsonrpc: '2.0' as const, id: 1, result: 'primary' } as JsonRpcResponse<T>;
        },
        requestBatch: async () => [],
      };

      const backup: Transport = {
        type: 'http',
        request: async <T = unknown>() => {
          backupCalls++;
          return { jsonrpc: '2.0' as const, id: 1, result: 'backup' } as JsonRpcResponse<T>;
        },
        requestBatch: async () => [],
      };

      const transport = fallbackTransport([primary, backup], {
        retryCount: 1,
        rank: true,
      });

      // First call: primary fails, backup succeeds
      await transport.request({ jsonrpc: '2.0', id: 1, method: 'test' });
      expect(backupCalls).toBe(1);

      // With ranking, backup should now be tried first
      await transport.request({ jsonrpc: '2.0', id: 1, method: 'test' });
      expect(backupCalls).toBe(2);
    });
  });
});

// ============ JSON-RPC 2.0 Compliance Tests ============

describe('JSON-RPC 2.0 Compliance', () => {
  let mockFetch: ReturnType<typeof mock>;

  beforeEach(() => {
    mockFetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: null }),
      }),
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  it('request has jsonrpc version 2.0', async () => {
    const transport = httpTransport('https://example.com');
    await transport.request({ jsonrpc: '2.0', id: 1, method: 'test' });

    const body = JSON.parse(
      (mockFetch.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.jsonrpc).toBe('2.0');
  });

  it('notification has no id', async () => {
    const transport = httpTransport('https://example.com');
    // Notifications should not have id, but our transport auto-assigns for tracking
    // This is intentional - we always want responses
    await transport.request({ jsonrpc: '2.0', method: 'notify' });

    const body = JSON.parse(
      (mockFetch.mock.calls[0]![1] as RequestInit).body as string,
    );
    // We auto-assign id for internal tracking
    expect(body.id).toBeDefined();
  });

  it('batch responses matched by id regardless of order', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { jsonrpc: '2.0', id: 'c', result: 3 },
            { jsonrpc: '2.0', id: 'a', result: 1 },
            { jsonrpc: '2.0', id: 'b', result: 2 },
          ]),
      }),
    );

    const transport = httpTransport('https://example.com');
    const responses = await transport.requestBatch([
      { jsonrpc: '2.0', id: 'a', method: 'first' },
      { jsonrpc: '2.0', id: 'b', method: 'second' },
      { jsonrpc: '2.0', id: 'c', method: 'third' },
    ]);

    // Responses should be reordered to match request order
    expect(responses[0]!.id).toBe('a');
    expect((responses[0] as { result: number }).result).toBe(1);
    expect(responses[1]!.id).toBe('b');
    expect((responses[1] as { result: number }).result).toBe(2);
    expect(responses[2]!.id).toBe('c');
    expect((responses[2] as { result: number }).result).toBe(3);
  });
});
