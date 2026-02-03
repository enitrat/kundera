import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { HttpProvider } from './HttpProvider.js';

const makeJsonResponse = (payload: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => payload,
  } as Response);

describe('HttpProvider', () => {
  let originalFetch: typeof fetch | undefined;
  let mockFetch: ReturnType<typeof mock>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockFetch = mock(() => makeJsonResponse({ jsonrpc: '2.0', id: 1, result: 123 }));
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch as typeof fetch;
  });

  it('executes request() and returns result', async () => {
    const provider = new HttpProvider('http://localhost:9545');
    const result = await provider.request({ method: 'starknet_blockNumber' });
    expect(result).toBe(123);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('passes params object as-is', async () => {
    const provider = new HttpProvider('http://localhost:9545');
    await provider.request({
      method: 'starknet_call',
      params: { contract_address: '0x1', entry_point_selector: '0x2', calldata: [] },
    });

    const call = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(call[1].body as string);
    expect(body.params).toEqual({
      contract_address: '0x1',
      entry_point_selector: '0x2',
      calldata: [],
    });
  });

  it('wraps starknet_* methods as Response<T>', async () => {
    const provider = new HttpProvider('http://localhost:9545');
    const response = await provider.starknet_blockNumber();
    expect(response.error).toBeUndefined();
    expect(response.result).toBe(123);
  });

  it('request() throws on JSON-RPC error response', async () => {
    mockFetch.mockImplementation(() =>
      makeJsonResponse({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32601, message: 'Method not found' },
      }),
    );

    const provider = new HttpProvider('http://localhost:9545');
    await expect(
      provider.request({ method: 'starknet_unknown' }),
    ).rejects.toMatchObject({ code: -32601, message: 'Method not found' });
  });
});
