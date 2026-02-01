import { describe, expect, it } from 'bun:test';
import '../../../src/test-utils/setupCrypto';
import { computeSelector, type Abi } from 'kundera/abi';
import {
  decodeEvents,
  decodeEventsStrict,
  compileEventFilter,
  type TransactionReceipt,
} from './index';

describe('event-filtering skill', () => {
  const EVENT_ABI: Abi = [
    {
      type: 'struct',
      name: 'core::integer::u256',
      members: [
        { name: 'low', type: 'core::integer::u128' },
        { name: 'high', type: 'core::integer::u128' },
      ],
    },
    {
      type: 'event',
      name: 'Transfer',
      kind: 'struct',
      members: [
        { name: 'from', type: 'core::starknet::contract_address::ContractAddress', kind: 'key' },
        { name: 'to', type: 'core::starknet::contract_address::ContractAddress', kind: 'key' },
        { name: 'value', type: 'core::integer::u256', kind: 'data' },
      ],
    },
    {
      type: 'event',
      name: 'Approval',
      kind: 'struct',
      members: [
        { name: 'owner', type: 'core::starknet::contract_address::ContractAddress', kind: 'key' },
        { name: 'spender', type: 'core::starknet::contract_address::ContractAddress', kind: 'key' },
        { name: 'value', type: 'core::integer::u256', kind: 'data' },
      ],
    },
  ];

  const transferSelector = '0x' + computeSelector('Transfer').toString(16);
  const approvalSelector = '0x' + computeSelector('Approval').toString(16);

  const sampleReceipt: TransactionReceipt = {
    events: [
      {
        from_address: '0x1',
        keys: [transferSelector, '0x123', '0x456'],
        data: ['0x3e8', '0x0'],
      },
      {
        from_address: '0x1',
        keys: [approvalSelector, '0x123', '0x789'],
        data: ['0x7d0', '0x0'],
      },
      {
        from_address: '0x2',
        keys: [transferSelector, '0xaaa', '0xbbb'],
        data: ['0x1f4', '0x0'],
      },
    ],
  };

  it('decodes all events from receipt', () => {
    const result = decodeEvents(sampleReceipt, EVENT_ABI);
    expect(result.error).toBeNull();
    expect(result.result).toHaveLength(3);
  });

  it('filters by event name', () => {
    const result = decodeEvents(sampleReceipt, EVENT_ABI, { event: 'Transfer' });
    expect(result.error).toBeNull();
    expect(result.result).toHaveLength(2);
  });

  it('filters by indexed args with OR semantics', () => {
    const result = decodeEvents(sampleReceipt, EVENT_ABI, {
      event: 'Transfer',
      args: { from: [0x123n, 0xaaan] },
    });
    expect(result.error).toBeNull();
    expect(result.result).toHaveLength(2);
  });

  it('filters with rawKeys', () => {
    const selector = computeSelector('Transfer');
    const result = decodeEvents(sampleReceipt, EVENT_ABI, {
      rawKeys: [[selector], [0x123n]],
    });
    expect(result.error).toBeNull();
    expect(result.result).toHaveLength(1);
  });

  it('compileEventFilter encodes selector and keys', () => {
    const result = compileEventFilter(EVENT_ABI, 'Transfer', { from: 0x123n });
    expect(result.error).toBeNull();
    expect(result.result!.selector).toBe(computeSelector('Transfer'));
    expect(result.result!.argKeys[0]).toEqual([0x123n]);
  });

  it('decodeEventsStrict errors on unknown event', () => {
    const receipt: TransactionReceipt = {
      events: [
        {
          from_address: '0x1',
          keys: ['0xdeadbeef'],
          data: [],
        },
      ],
    };
    const result = decodeEventsStrict(receipt, EVENT_ABI);
    expect(result.error).toBeDefined();
    expect(result.result).toBeNull();
  });
});
