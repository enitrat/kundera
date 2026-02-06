import { describe, it, expect } from 'vitest';
import {
  blockWithTxHashesFromRpc,
  blockWithTxHashesToRpc,
  blockWithTxsFromRpc,
  blockWithTxsToRpc,
  blockWithReceiptsFromRpc,
  blockWithReceiptsToRpc,
} from './block.js';
import { hexToFelt } from './helpers.js';
import type { BlockWithTxHashes, BlockWithTxs, BlockWithReceipts } from '../types.js';

function canon(hex: string): string {
  return hexToFelt(hex).toHex();
}

const headerFields = {
  block_hash: '0x0b0',
  parent_hash: '0x0a0',
  block_number: 10,
  new_root: '0x0c0',
  timestamp: 1700000000,
  sequencer_address: '0x01',
  l1_gas_price: { price_in_fri: '0x0a', price_in_wei: '0x0b' },
  l2_gas_price: { price_in_fri: '0x0c', price_in_wei: '0x0d' },
  l1_data_gas_price: { price_in_fri: '0x0e', price_in_wei: '0x0f' },
  l1_da_mode: 'BLOB' as const,
  starknet_version: '0.13.0',
  event_commitment: '0x0e1',
  transaction_commitment: '0x0a2',
  receipt_commitment: '0x0b2',
  state_diff_commitment: '0x0c2',
  event_count: 5,
  transaction_count: 3,
  state_diff_length: 10,
};

describe('blockWithTxHashes', () => {
  const wire: BlockWithTxHashes = {
    ...headerFields,
    status: 'ACCEPTED_ON_L2',
    transactions: ['0x0aa1', '0x0aa2'],
  };

  it('round-trips', () => {
    const rich = blockWithTxHashesFromRpc(wire);
    expect(rich.status).toBe('ACCEPTED_ON_L2');
    expect(rich.transactions.length).toBe(2);
    expect(rich.transactions[0]!.toBigInt()).toBe(BigInt('0x0aa1'));

    const back = blockWithTxHashesToRpc(rich);
    expect(back.status).toBe('ACCEPTED_ON_L2');
    expect(back.transactions.length).toBe(2);
    expect(back.transactions[0]).toBe(canon('0x0aa1'));
  });
});

describe('blockWithTxs', () => {
  const wire: BlockWithTxs = {
    ...headerFields,
    status: 'ACCEPTED_ON_L2',
    transactions: [
      {
        type: 'INVOKE',
        version: '0x1',
        transaction_hash: '0x0abc',
        sender_address: '0x01',
        calldata: ['0x02'],
        max_fee: '0x0ff',
        signature: ['0x0a'],
        nonce: '0x00',
      },
    ],
  };

  it('round-trips', () => {
    const rich = blockWithTxsFromRpc(wire);
    expect(rich.transactions.length).toBe(1);
    expect(rich.transactions[0]!.type).toBe('INVOKE');
    expect(rich.transactions[0]!.transaction_hash.toBigInt()).toBe(BigInt('0x0abc'));

    const back = blockWithTxsToRpc(rich);
    expect(back.transactions[0]!.transaction_hash).toBe(canon('0x0abc'));
  });
});

describe('blockWithReceipts', () => {
  const wire: BlockWithReceipts = {
    ...headerFields,
    status: 'ACCEPTED_ON_L2',
    transactions: [
      {
        transaction: {
          type: 'INVOKE',
          version: '0x1',
          sender_address: '0x01',
          calldata: ['0x02'],
          max_fee: '0x0ff',
          signature: ['0x0a'],
          nonce: '0x00',
        },
        receipt: {
          type: 'INVOKE',
          transaction_hash: '0x0abc',
          actual_fee: { amount: '0x100', unit: 'WEI' },
          finality_status: 'ACCEPTED_ON_L2',
          messages_sent: [],
          events: [],
          execution_resources: { steps: 50 },
          execution_status: 'SUCCEEDED',
        },
      },
    ],
  };

  it('round-trips', () => {
    const rich = blockWithReceiptsFromRpc(wire);
    expect(rich.transactions.length).toBe(1);
    expect(rich.transactions[0]!.transaction.type).toBe('INVOKE');
    expect(rich.transactions[0]!.receipt.type).toBe('INVOKE');

    const back = blockWithReceiptsToRpc(rich);
    expect(back.transactions[0]!.receipt.transaction_hash).toBe(canon('0x0abc'));
  });
});
