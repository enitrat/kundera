import { describe, expect, it } from 'bun:test';
import type { JsonRpcRequest, Transport } from 'kundera/transport';
import { readContract } from './index';

const ABI = [
  {
    type: 'function',
    name: 'get',
    inputs: [],
    outputs: [{ name: 'value', type: 'core::felt252' }],
    state_mutability: 'view',
  },
] as const;

const mockTransport: Transport = {
  type: 'http',
  async request(request: JsonRpcRequest) {
    if (request.method === 'starknet_call') {
      return { jsonrpc: '2.0', id: request.id ?? 1, result: ['0x1'] };
    }
    return { jsonrpc: '2.0', id: request.id ?? 1, result: null };
  },
  async requestBatch() {
    return [];
  },
};

describe('contract-read skill', () => {
  it('decodes read results', async () => {
    const { result, error } = await readContract(mockTransport, {
      abi: ABI as any,
      address: '0xabc',
      functionName: 'get',
      args: [],
    });

    expect(error).toBeNull();
    expect(result).toBeDefined();
    expect(result?.[0]).toBe(1n);
  });
});
