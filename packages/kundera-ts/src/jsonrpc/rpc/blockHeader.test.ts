import { describe, it, expect } from 'vitest';
import {
  blockHeaderFromRpc,
  blockHeaderToRpc,
  blockHeaderWithCommitmentsFromRpc,
  blockHeaderWithCommitmentsToRpc,
} from './blockHeader.js';
import { hexToFelt } from './helpers.js';
import type { BlockHeader, BlockHeaderWithCommitments } from '../types.js';

/** Canonicalize hex through Felt252 */
function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

const wireHeader: BlockHeader = {
  block_hash: '0x03fa',
  parent_hash: '0x03fb',
  block_number: 123,
  new_root: '0x0abc',
  timestamp: 1700000000,
  sequencer_address: '0x01',
  l1_gas_price: { price_in_fri: '0x0a', price_in_wei: '0x0b' },
  l2_gas_price: { price_in_fri: '0x0c', price_in_wei: '0x0d' },
  l1_data_gas_price: { price_in_fri: '0x0e', price_in_wei: '0x0f' },
  l1_da_mode: 'BLOB',
  starknet_version: '0.13.0',
};

describe('blockHeader', () => {
  it('round-trips', () => {
    const rich = blockHeaderFromRpc(wireHeader);
    expect(rich.block_number).toBe(123);
    expect(rich.timestamp).toBe(1700000000);
    expect(rich.l1_da_mode).toBe('BLOB');
    expect(rich.starknet_version).toBe('0.13.0');
    // Branded types preserve value
    expect(rich.block_hash.toBigInt()).toBe(BigInt(wireHeader.block_hash));
    expect(rich.sequencer_address.toBigInt()).toBe(BigInt(wireHeader.sequencer_address));

    const back = blockHeaderToRpc(rich);
    expect(back.block_number).toBe(123);
    expect(back.timestamp).toBe(1700000000);
    expect(back.l1_da_mode).toBe('BLOB');
    expect(back.starknet_version).toBe('0.13.0');
    // Canonicalized hex round-trip
    expect(back.block_hash).toBe(canon(wireHeader.block_hash));
    expect(back.sequencer_address).toBe(canon(wireHeader.sequencer_address));
  });
});

describe('blockHeaderWithCommitments', () => {
  const wireWithCommitments: BlockHeaderWithCommitments = {
    ...wireHeader,
    event_commitment: '0x0e1',
    transaction_commitment: '0x0a1',
    receipt_commitment: '0x0b1',
    state_diff_commitment: '0x0c1',
    event_count: 10,
    transaction_count: 5,
    state_diff_length: 20,
  };

  it('round-trips', () => {
    const rich = blockHeaderWithCommitmentsFromRpc(wireWithCommitments);
    expect(rich.event_count).toBe(10);
    expect(rich.transaction_count).toBe(5);
    expect(rich.state_diff_length).toBe(20);

    const back = blockHeaderWithCommitmentsToRpc(rich);
    expect(back.event_count).toBe(10);
    expect(back.event_commitment).toBe(canon('0x0e1'));
  });
});
