import { describe, expect, it } from 'bun:test';
import { writeContract } from './index';

const ABI = [
  {
    type: 'function',
    name: 'set',
    inputs: [{ name: 'value', type: 'core::felt252' }],
    outputs: [],
    state_mutability: 'external',
  },
] as const;

describe('contract-write skill', () => {
  it('executes via account executor', async () => {
    const account = {
      address: '0xabc',
      execute: async () => ({ transaction_hash: '0x123' }),
    };

    const { result, error } = await writeContract({
      abi: ABI as any,
      address: '0xabc',
      functionName: 'set',
      args: [1n],
      account,
    });

    expect(error).toBeNull();
    expect(result?.transactionHash).toBe('0x123');
  });
});
