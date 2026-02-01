import { describe, expect, it } from 'bun:test';
import type { JsonRpcRequest, Transport } from 'kundera/transport';
import { multicallRead } from './index';

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
  async request() {
    return { jsonrpc: '2.0', id: 1, result: null } as any;
  },
  async requestBatch(requests: JsonRpcRequest[], _options?) {
    return requests.map((req, idx) => ({
      jsonrpc: '2.0',
      id: req.id ?? idx + 1,
      result: [idx === 0 ? '0x1' : '0x2'],
    })) as any;
  },
};

describe('contract-multicall skill', () => {
  it('returns results for each call', async () => {
    const results = await multicallRead(mockTransport, [
      { abi: ABI as any, address: '0x1', functionName: 'get', args: [] },
      { abi: ABI as any, address: '0x2', functionName: 'get', args: [] },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]?.result?.[0]).toBe(1n);
    expect(results[1]?.result?.[0]).toBe(2n);
  });
});
