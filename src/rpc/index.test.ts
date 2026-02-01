/**
 * RPC Methods Tests
 */

import { describe, expect, test } from 'bun:test';
import {
  starknet_chainId,
  starknet_getNonce,
  starknet_getStorageAt,
} from './index.js';
import { ContractAddress, Felt252 } from '../primitives/index.js';
import type { JsonRpcRequest, JsonRpcResponse, Transport } from '../transport/types.js';

function createMockTransport(
  handler: (request: JsonRpcRequest) => JsonRpcResponse,
): Transport {
  return {
    type: 'http',
    async request(request) {
      return handler(request);
    },
    async requestBatch() {
      return [];
    },
  };
}

describe('rpc methods', () => {
  test('starknet_chainId returns result', async () => {
    const transport = createMockTransport(() => ({
      jsonrpc: '2.0',
      id: 1,
      result: '0x534e5f4d41494e',
    }));

    const result = await starknet_chainId(transport);
    expect(result).toBe('0x534e5f4d41494e');
  });

  test('starknet_getNonce formats address and uses pending default', async () => {
    let captured: JsonRpcRequest | null = null;
    const transport = createMockTransport((request) => {
      captured = request;
      return {
        jsonrpc: '2.0',
        id: request.id ?? 1,
        result: '0x1',
      };
    });

    const address = ContractAddress(0x123n);
    await starknet_getNonce(transport, address);

    expect(captured?.method).toBe('starknet_getNonce');
    expect(captured?.params).toEqual(['pending', address.toHex()]);
  });

  test('starknet_getStorageAt formats key', async () => {
    let captured: JsonRpcRequest | null = null;
    const transport = createMockTransport((request) => {
      captured = request;
      return {
        jsonrpc: '2.0',
        id: request.id ?? 1,
        result: '0xdead',
      };
    });

    const key = Felt252(1n);
    await starknet_getStorageAt(transport, '0xabc', key);

    expect(captured?.params).toEqual(['0xabc', key.toHex(), 'latest']);
  });

  test('errors include code and data', async () => {
    const transport = createMockTransport((request) => ({
      jsonrpc: '2.0',
      id: request.id ?? 1,
      error: {
        code: 20,
        message: 'Contract not found',
        data: { contract_address: '0x123' },
      },
    }));

    try {
      await starknet_chainId(transport);
      expect(true).toBe(false);
    } catch (err) {
      const error = err as Error & { code: number; data?: unknown };
      expect(error.message).toBe('Contract not found');
      expect(error.code).toBe(20);
      expect(error.data).toEqual({ contract_address: '0x123' });
    }
  });
});
