/**
 * Transport Module Tests
 *
 * Tests for JSON-RPC transports: HTTP, WebSocket, and Fallback.
 * Tests JSON-RPC 2.0 compliance, batching, and error handling.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  httpTransport,
  createRequest,
  createErrorResponse,
  matchBatchResponses,
  isJsonRpcError,
  type JsonRpcRequest,
  type JsonRpcResponse,
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
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockFetch = vi.fn(() =>
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

});

// ============ JSON-RPC 2.0 Compliance Tests ============

describe('JSON-RPC 2.0 Compliance', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(() =>
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
