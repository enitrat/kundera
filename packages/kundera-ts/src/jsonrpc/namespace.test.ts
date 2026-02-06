import { describe, expect, it } from 'vitest';
import { Rpc } from './index.js';

describe('Rpc request builders', () => {
  it('builds block number request', () => {
    const req = Rpc.BlockNumberRequest();
    expect(req).toEqual({ method: 'starknet_blockNumber', params: [] });
  });

  it('builds spec version request', () => {
    const req = Rpc.SpecVersionRequest();
    expect(req).toEqual({ method: 'starknet_specVersion', params: [] });
  });

  it('builds chain id request', () => {
    const req = Rpc.ChainIdRequest();
    expect(req).toEqual({ method: 'starknet_chainId', params: [] });
  });

  it('builds syncing request', () => {
    const req = Rpc.SyncingRequest();
    expect(req).toEqual({ method: 'starknet_syncing', params: [] });
  });

  it('builds block hash and number request', () => {
    const req = Rpc.BlockHashAndNumberRequest();
    expect(req).toEqual({ method: 'starknet_blockHashAndNumber', params: [] });
  });

  it('builds call request with default blockId', () => {
    const req = Rpc.CallRequest(
      { contract_address: '0x1', entry_point_selector: '0x2', calldata: [] },
    );
    expect(req.method).toBe('starknet_call');
    expect(req.params).toEqual([
      { contract_address: '0x1', entry_point_selector: '0x2', calldata: [] },
      'latest',
    ]);
  });

  it('builds call request with explicit blockId', () => {
    const req = Rpc.CallRequest(
      { contract_address: '0x1', entry_point_selector: '0x2', calldata: [] },
      'pending',
    );
    expect(req.params).toEqual([
      { contract_address: '0x1', entry_point_selector: '0x2', calldata: [] },
      'pending',
    ]);
  });

  it('builds get block with tx hashes request', () => {
    const req = Rpc.GetBlockWithTxHashesRequest();
    expect(req).toEqual({ method: 'starknet_getBlockWithTxHashes', params: ['latest'] });
  });

  it('builds get storage at request', () => {
    const req = Rpc.GetStorageAtRequest('0xabc', '0x1');
    expect(req).toEqual({
      method: 'starknet_getStorageAt',
      params: ['0xabc', '0x1', 'latest'],
    });
  });

  it('builds get transaction by hash request', () => {
    const req = Rpc.GetTransactionByHashRequest('0xdeadbeef');
    expect(req).toEqual({
      method: 'starknet_getTransactionByHash',
      params: ['0xdeadbeef'],
    });
  });

  it('builds get transaction by block id and index request', () => {
    const req = Rpc.GetTransactionByBlockIdAndIndexRequest('latest', 3);
    expect(req).toEqual({
      method: 'starknet_getTransactionByBlockIdAndIndex',
      params: ['latest', 3],
    });
  });

  it('builds estimate fee request', () => {
    const req = Rpc.EstimateFeeRequest([{ type: 'INVOKE' } as any]);
    expect(req).toEqual({
      method: 'starknet_estimateFee',
      params: [[{ type: 'INVOKE' }], [], 'latest'],
    });
  });

  it('builds get nonce request', () => {
    const req = Rpc.GetNonceRequest('pending', '0x123');
    expect(req).toEqual({
      method: 'starknet_getNonce',
      params: ['pending', '0x123'],
    });
  });

  it('builds add invoke transaction request', () => {
    const tx = { type: 'INVOKE', sender_address: '0x1' } as any;
    const req = Rpc.AddInvokeTransactionRequest(tx);
    expect(req).toEqual({
      method: 'starknet_addInvokeTransaction',
      params: [tx],
    });
  });

  it('builds trace transaction request', () => {
    const req = Rpc.TraceTransactionRequest('0xabc');
    expect(req).toEqual({
      method: 'starknet_traceTransaction',
      params: ['0xabc'],
    });
  });

  it('builds simulate transactions request', () => {
    const req = Rpc.SimulateTransactionsRequest('latest', [{ type: 'INVOKE' } as any]);
    expect(req).toEqual({
      method: 'starknet_simulateTransactions',
      params: ['latest', [{ type: 'INVOKE' }], []],
    });
  });

  it('builds subscribe events request with positional params', () => {
    const req = Rpc.SubscribeEventsRequest({
      from_address: '0xabc',
      keys: [['0x1']],
      block_id: { block_hash: '0x2' },
      finality_status: 'RECEIVED',
    });
    expect(req.method).toBe('starknet_subscribeEvents');
    expect(req.params).toEqual(['0xabc', [['0x1']], { block_hash: '0x2' }, 'RECEIVED']);
  });

  it('builds subscribe new heads request without params', () => {
    const req = Rpc.SubscribeNewHeadsRequest();
    expect(req).toEqual({ method: 'starknet_subscribeNewHeads', params: [] });
  });

  it('builds subscribe new heads request with block_id', () => {
    const req = Rpc.SubscribeNewHeadsRequest({ block_id: 'latest' });
    expect(req).toEqual({ method: 'starknet_subscribeNewHeads', params: ['latest'] });
  });

  it('builds subscribe new transactions request with params', () => {
    const req = Rpc.SubscribeNewTransactionsRequest({
      finality_status: 'ACCEPTED_ON_L2',
      sender_address: ['0x1'],
    });
    expect(req.method).toBe('starknet_subscribeNewTransactions');
    expect(req.params).toEqual(['ACCEPTED_ON_L2', ['0x1']]);
  });

  it('builds subscribe new transaction receipts request', () => {
    const req = Rpc.SubscribeNewTransactionReceiptsRequest({
      finality_status: 'ACCEPTED_ON_L2',
    });
    expect(req.method).toBe('starknet_subscribeNewTransactionReceipts');
    expect(req.params).toEqual(['ACCEPTED_ON_L2']);
  });

  it('builds subscribe transaction status request', () => {
    const req = Rpc.SubscribeTransactionStatusRequest('0xabc');
    expect(req).toEqual({
      method: 'starknet_subscribeTransactionStatus',
      params: ['0xabc'],
    });
  });

  it('builds unsubscribe request', () => {
    const req = Rpc.UnsubscribeRequest('sub-1');
    expect(req).toEqual({ method: 'starknet_unsubscribe', params: ['sub-1'] });
  });

  it('builds get storage proof request', () => {
    const req = Rpc.GetStorageProofRequest(
      'latest',
      ['0xclass1'],
      ['0xaddr1'],
      [{ contract_address: '0xaddr1', storage_keys: ['0xkey1'] }],
    );
    expect(req).toEqual({
      method: 'starknet_getStorageProof',
      params: [
        'latest',
        ['0xclass1'],
        ['0xaddr1'],
        [{ contract_address: '0xaddr1', storage_keys: ['0xkey1'] }],
      ],
    });
  });
});
