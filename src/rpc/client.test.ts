/**
 * JSON-RPC Client Tests
 *
 * Tests the Starknet RPC client with mocked fetch.
 */

import { describe, expect, test, mock } from 'bun:test';
import {
  StarknetRpcClient,
  createClient,
  mainnet,
  sepolia,
} from './client';
import { Felt252 } from '../primitives/index';

// Helper to create a mock fetch that returns a specific response
function mockFetch(response: unknown) {
  return mock(async (_url: string, _options?: RequestInit) => ({
    ok: true,
    json: async () => response,
  }));
}

// Helper to create a mock fetch that returns an error response
function mockFetchError(status: number, statusText: string) {
  return mock(async (_url: string, _options?: RequestInit) => ({
    ok: false,
    status,
    statusText,
  }));
}

describe('StarknetRpcClient', () => {
  describe('creation', () => {
    test('createClient creates a client', () => {
      const client = createClient({ url: 'http://localhost:5050' });
      expect(client).toBeInstanceOf(StarknetRpcClient);
    });

    test('mainnet creates a client with mainnet URL', () => {
      const client = mainnet();
      expect(client).toBeInstanceOf(StarknetRpcClient);
    });

    test('sepolia creates a client with testnet URL', () => {
      const client = sepolia();
      expect(client).toBeInstanceOf(StarknetRpcClient);
    });
  });

  describe('chainId', () => {
    test('returns chain ID', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: '0x534e5f4d41494e', // SN_MAIN
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const chainId = await client.chainId();
      expect(chainId).toBe('0x534e5f4d41494e');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('blockNumber', () => {
    test('returns current block number', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: 123456,
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const blockNum = await client.blockNumber();
      expect(blockNum).toBe(123456);
    });
  });

  describe('getNonce', () => {
    test('returns nonce for address string', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: '0x5',
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const nonce = await client.getNonce('0x123');
      expect(nonce).toBe('0x5');
    });

    test('returns nonce for Felt252 address', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: '0x10',
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const address = Felt252(0x456n);
      const nonce = await client.getNonce(address);
      expect(nonce).toBe('0x10');
    });

    test('accepts block ID', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: '0x1',
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      await client.getNonce('0x123', { block_number: 100 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStorageAt', () => {
    test('returns storage value', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: '0xdeadbeef',
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const value = await client.getStorageAt('0x123', '0x0');
      expect(value).toBe('0xdeadbeef');
    });

    test('accepts Felt252 key', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: '0x42',
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const key = Felt252(1);
      const value = await client.getStorageAt('0x123', key);
      expect(value).toBe('0x42');
    });
  });

  describe('getClassHashAt', () => {
    test('returns class hash', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: '0xabc123',
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const hash = await client.getClassHashAt('0x123');
      expect(hash).toBe('0xabc123');
    });
  });

  describe('callContract', () => {
    test('returns call result', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: ['0x1', '0x2', '0x3'],
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const result = await client.callContract({
        contract_address: '0x123',
        entry_point_selector: '0x456',
        calldata: ['0x1'],
      });

      expect(result).toEqual(['0x1', '0x2', '0x3']);
    });
  });

  describe('getTransactionByHash', () => {
    test('returns transaction', async () => {
      const txData = {
        transaction_hash: '0xabc',
        type: 'INVOKE',
        version: '0x1',
      };

      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: txData,
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const tx = await client.getTransactionByHash('0xabc');
      expect(tx).toEqual(txData);
    });
  });

  describe('getTransactionReceipt', () => {
    test('returns receipt', async () => {
      const receiptData = {
        transaction_hash: '0xabc',
        status: 'ACCEPTED_ON_L2',
      };

      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: receiptData,
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const receipt = await client.getTransactionReceipt('0xabc');
      expect(receipt).toEqual(receiptData);
    });
  });

  describe('getEvents', () => {
    test('returns events', async () => {
      const eventsData = {
        events: [
          { from_address: '0x1', keys: ['0xa'], data: ['0xb'] },
        ],
        continuation_token: 'token123',
      };

      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        result: eventsData,
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      const result = await client.getEvents({
        from_block: 'latest',
        chunk_size: 100,
      });

      expect(result.events).toHaveLength(1);
      expect(result.continuation_token).toBe('token123');
    });
  });

  describe('error handling', () => {
    test('throws on HTTP error', async () => {
      const fetchMock = mockFetchError(500, 'Internal Server Error');

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      await expect(client.chainId()).rejects.toThrow('HTTP 500');
    });

    test('throws on RPC error', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      await expect(client.chainId()).rejects.toThrow('Method not found');
    });

    test('RPC error includes code and data', async () => {
      const fetchMock = mockFetch({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: 20,
          message: 'Contract not found',
          data: { contract_address: '0x123' },
        },
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      try {
        await client.chainId();
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        const error = err as Error & { code: number; data: unknown };
        expect(error.message).toBe('Contract not found');
        expect(error.code).toBe(20);
        expect(error.data).toEqual({ contract_address: '0x123' });
      }
    });
  });

  describe('block ID formatting', () => {
    test('handles "latest" tag', async () => {
      let capturedBody = '';
      const fetchMock = mock(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string;
        return {
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1' }),
        };
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      await client.getNonce('0x123', 'latest');
      expect(capturedBody).toContain('"latest"');
    });

    test('handles "pending" tag', async () => {
      let capturedBody = '';
      const fetchMock = mock(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string;
        return {
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1' }),
        };
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      await client.getNonce('0x123', 'pending');
      expect(capturedBody).toContain('"pending"');
    });

    test('handles block number', async () => {
      let capturedBody = '';
      const fetchMock = mock(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string;
        return {
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1' }),
        };
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      await client.getNonce('0x123', { block_number: 12345 });
      expect(capturedBody).toContain('"block_number":12345');
    });

    test('handles block hash', async () => {
      let capturedBody = '';
      const fetchMock = mock(async (_url: string, options?: RequestInit) => {
        capturedBody = options?.body as string;
        return {
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1' }),
        };
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      await client.getNonce('0x123', { block_hash: '0xabcdef' });
      expect(capturedBody).toContain('"block_hash":"0xabcdef"');
    });
  });

  describe('request ID incrementing', () => {
    test('increments request ID on each call', async () => {
      const capturedIds: number[] = [];
      const fetchMock = mock(async (_url: string, options?: RequestInit) => {
        const body = JSON.parse(options?.body as string);
        capturedIds.push(body.id);
        return {
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: body.id, result: '0x1' }),
        };
      });

      const client = createClient({
        url: 'http://test',
        fetch: fetchMock as typeof fetch,
      });

      await client.chainId();
      await client.blockNumber();
      await client.chainId();

      expect(capturedIds).toEqual([1, 2, 3]);
    });
  });
});
