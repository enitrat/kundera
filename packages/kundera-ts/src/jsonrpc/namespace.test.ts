import { describe, expect, it } from 'bun:test';
import { Starknet } from './namespace.js';

describe('Rpc namespace builders', () => {
  it('builds block number request', () => {
    const req = Starknet.BlockNumberRequest();
    expect(req).toEqual({ method: 'starknet_blockNumber', params: [] });
  });

  it('builds call request with default blockId', () => {
    const req = Starknet.CallRequest(
      { contract_address: '0x1', entry_point_selector: '0x2', calldata: [] },
      'latest',
    );
    expect(req.method).toBe('starknet_call');
    expect(req.params).toEqual([
      { contract_address: '0x1', entry_point_selector: '0x2', calldata: [] },
      'latest',
    ]);
  });

  it('builds subscribe events request with positional params', () => {
    const req = Starknet.SubscribeEventsRequest({
      from_address: '0xabc',
      keys: [['0x1']],
      block_id: { block_hash: '0x2' },
      finality_status: 'RECEIVED',
    });
    expect(req.method).toBe('starknet_subscribeEvents');
    expect(req.params).toEqual(['0xabc', [['0x1']], { block_hash: '0x2' }, 'RECEIVED']);
  });

  it('builds subscribe new transactions request with params', () => {
    const req = Starknet.SubscribeNewTransactionsRequest({
      finality_status: 'ACCEPTED_ON_L2',
      sender_address: ['0x1'],
    });
    expect(req.method).toBe('starknet_subscribeNewTransactions');
    expect(req.params).toEqual(['ACCEPTED_ON_L2', ['0x1']]);
  });

  it('builds unsubscribe request', () => {
    const req = Starknet.UnsubscribeRequest('sub-1');
    expect(req).toEqual({ method: 'starknet_unsubscribe', params: ['sub-1'] });
  });
});
