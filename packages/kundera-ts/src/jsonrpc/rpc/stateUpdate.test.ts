import { describe, it, expect } from 'vitest';
import { stateUpdateFromRpc, stateUpdateToRpc } from './stateUpdate.js';
import { hexToFelt } from './helpers.js';
import type { StateUpdate } from '../types.js';

function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

describe('stateUpdate', () => {
  const wire: StateUpdate = {
    block_hash: '0x0b0',
    old_root: '0x0a1',
    new_root: '0x0a2',
    state_diff: {
      storage_diffs: [
        {
          address: '0x01',
          storage_entries: [{ key: '0x0a', value: '0x0b' }],
        },
      ],
      declared_classes: [
        { class_hash: '0x0c0', compiled_class_hash: '0x0c1' },
      ],
      deployed_contracts: [{ address: '0x02', class_hash: '0x0c2' }],
      replaced_classes: [
        { contract_address: '0x03', class_hash: '0x0c3' },
      ],
      nonces: [{ contract_address: '0x04', nonce: '0x05' }],
    },
  };

  it('round-trips', () => {
    const rich = stateUpdateFromRpc(wire);
    expect(rich.block_hash.toBigInt()).toBe(BigInt('0x0b0'));
    expect(rich.state_diff.storage_diffs[0]!.storage_entries[0]!.key.toBigInt()).toBe(BigInt('0x0a'));
    expect(rich.state_diff.declared_classes[0]!.class_hash.toBigInt()).toBe(BigInt('0x0c0'));
    expect(rich.state_diff.deployed_contracts[0]!.address.toBigInt()).toBe(BigInt('0x02'));
    expect(rich.state_diff.replaced_classes[0]!.contract_address.toBigInt()).toBe(BigInt('0x03'));
    expect(rich.state_diff.nonces[0]!.nonce.toBigInt()).toBe(BigInt('0x05'));

    const back = stateUpdateToRpc(rich);
    expect(back.block_hash).toBe(canon('0x0b0'));
    expect(back.state_diff.storage_diffs[0]!.storage_entries[0]!.key).toBe(canon('0x0a'));
  });
});
