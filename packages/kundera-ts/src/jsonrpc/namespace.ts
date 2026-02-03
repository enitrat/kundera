/**
 * Rpc Namespace - Request Constructor API
 *
 * Builders for Starknet JSON-RPC request arguments.
 */

import type { RequestArguments } from '../provider/types.js';
import type {
  BlockId,
  BroadcastedTxn,
  BroadcastedInvokeTxn,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  EventsFilter,
  FunctionCall,
  MsgFromL1,
  SimulationFlag,
  NewHeadsSubscriptionParams,
  EventsSubscriptionParams,
  PendingTransactionsSubscriptionParams,
  TransactionReceiptsSubscriptionParams,
} from './types.js';

const method = {
  specVersion: 'starknet_specVersion',
  getBlockWithTxHashes: 'starknet_getBlockWithTxHashes',
  getBlockWithTxs: 'starknet_getBlockWithTxs',
  getBlockWithReceipts: 'starknet_getBlockWithReceipts',
  getStateUpdate: 'starknet_getStateUpdate',
  getStorageAt: 'starknet_getStorageAt',
  getTransactionStatus: 'starknet_getTransactionStatus',
  getMessagesStatus: 'starknet_getMessagesStatus',
  getTransactionByHash: 'starknet_getTransactionByHash',
  getTransactionByBlockIdAndIndex: 'starknet_getTransactionByBlockIdAndIndex',
  getTransactionReceipt: 'starknet_getTransactionReceipt',
  getClass: 'starknet_getClass',
  getClassHashAt: 'starknet_getClassHashAt',
  getClassAt: 'starknet_getClassAt',
  getBlockTransactionCount: 'starknet_getBlockTransactionCount',
  call: 'starknet_call',
  estimateFee: 'starknet_estimateFee',
  estimateMessageFee: 'starknet_estimateMessageFee',
  blockNumber: 'starknet_blockNumber',
  blockHashAndNumber: 'starknet_blockHashAndNumber',
  chainId: 'starknet_chainId',
  syncing: 'starknet_syncing',
  getEvents: 'starknet_getEvents',
  getNonce: 'starknet_getNonce',
  getStorageProof: 'starknet_getStorageProof',
  addInvokeTransaction: 'starknet_addInvokeTransaction',
  addDeclareTransaction: 'starknet_addDeclareTransaction',
  addDeployAccountTransaction: 'starknet_addDeployAccountTransaction',
  traceTransaction: 'starknet_traceTransaction',
  simulateTransactions: 'starknet_simulateTransactions',
  traceBlockTransactions: 'starknet_traceBlockTransactions',
  subscribeNewHeads: 'starknet_subscribeNewHeads',
  subscribeEvents: 'starknet_subscribeEvents',
  subscribeTransactionStatus: 'starknet_subscribeTransactionStatus',
  subscribeNewTransactionReceipts: 'starknet_subscribeNewTransactionReceipts',
  subscribeNewTransactions: 'starknet_subscribeNewTransactions',
  unsubscribe: 'starknet_unsubscribe',
} as const;

export const Starknet = {
  SpecVersionRequest(): RequestArguments {
    return { method: method.specVersion, params: [] };
  },

  GetBlockWithTxHashesRequest(blockId: BlockId = 'latest'): RequestArguments {
    return { method: method.getBlockWithTxHashes, params: [blockId] };
  },

  GetBlockWithTxsRequest(blockId: BlockId = 'latest'): RequestArguments {
    return { method: method.getBlockWithTxs, params: [blockId] };
  },

  GetBlockWithReceiptsRequest(blockId: BlockId = 'latest'): RequestArguments {
    return { method: method.getBlockWithReceipts, params: [blockId] };
  },

  GetStateUpdateRequest(blockId: BlockId = 'latest'): RequestArguments {
    return { method: method.getStateUpdate, params: [blockId] };
  },

  GetStorageAtRequest(contractAddress: string, key: string, blockId: BlockId = 'latest'): RequestArguments {
    return { method: method.getStorageAt, params: [contractAddress, key, blockId] };
  },

  GetTransactionStatusRequest(transactionHash: string): RequestArguments {
    return { method: method.getTransactionStatus, params: [transactionHash] };
  },

  GetMessagesStatusRequest(l1TransactionHash: string): RequestArguments {
    return { method: method.getMessagesStatus, params: [l1TransactionHash] };
  },

  GetTransactionByHashRequest(transactionHash: string): RequestArguments {
    return { method: method.getTransactionByHash, params: [transactionHash] };
  },

  GetTransactionByBlockIdAndIndexRequest(blockId: BlockId, index: number): RequestArguments {
    return { method: method.getTransactionByBlockIdAndIndex, params: [blockId, index] };
  },

  GetTransactionReceiptRequest(transactionHash: string): RequestArguments {
    return { method: method.getTransactionReceipt, params: [transactionHash] };
  },

  GetClassRequest(blockId: BlockId, classHash: string): RequestArguments {
    return { method: method.getClass, params: [blockId, classHash] };
  },

  GetClassHashAtRequest(blockId: BlockId, contractAddress: string): RequestArguments {
    return { method: method.getClassHashAt, params: [blockId, contractAddress] };
  },

  GetClassAtRequest(blockId: BlockId, contractAddress: string): RequestArguments {
    return { method: method.getClassAt, params: [blockId, contractAddress] };
  },

  GetBlockTransactionCountRequest(blockId: BlockId = 'latest'): RequestArguments {
    return { method: method.getBlockTransactionCount, params: [blockId] };
  },

  CallRequest(request: FunctionCall, blockId: BlockId = 'latest'): RequestArguments {
    return { method: method.call, params: [request, blockId] };
  },

  EstimateFeeRequest(
    transactions: BroadcastedTxn[],
    simulationFlags: SimulationFlag[] = [],
    blockId: BlockId = 'latest',
  ): RequestArguments {
    return { method: method.estimateFee, params: [transactions, simulationFlags, blockId] };
  },

  EstimateMessageFeeRequest(message: MsgFromL1, blockId: BlockId = 'latest'): RequestArguments {
    return { method: method.estimateMessageFee, params: [message, blockId] };
  },

  BlockNumberRequest(): RequestArguments {
    return { method: method.blockNumber, params: [] };
  },

  BlockHashAndNumberRequest(): RequestArguments {
    return { method: method.blockHashAndNumber, params: [] };
  },

  ChainIdRequest(): RequestArguments {
    return { method: method.chainId, params: [] };
  },

  SyncingRequest(): RequestArguments {
    return { method: method.syncing, params: [] };
  },

  GetEventsRequest(filter: EventsFilter): RequestArguments {
    return { method: method.getEvents, params: [filter] };
  },

  GetNonceRequest(blockId: BlockId, contractAddress: string): RequestArguments {
    return { method: method.getNonce, params: [blockId, contractAddress] };
  },

  GetStorageProofRequest(
    blockId: BlockId,
    classHashes: string[],
    contractAddresses: string[],
    contractStorageKeys: { contract_address: string; storage_keys: string[] }[],
  ): RequestArguments {
    return {
      method: method.getStorageProof,
      params: [blockId, classHashes, contractAddresses, contractStorageKeys],
    };
  },

  AddInvokeTransactionRequest(transaction: BroadcastedInvokeTxn): RequestArguments {
    return { method: method.addInvokeTransaction, params: [transaction] };
  },

  AddDeclareTransactionRequest(transaction: BroadcastedDeclareTxn): RequestArguments {
    return { method: method.addDeclareTransaction, params: [transaction] };
  },

  AddDeployAccountTransactionRequest(transaction: BroadcastedDeployAccountTxn): RequestArguments {
    return { method: method.addDeployAccountTransaction, params: [transaction] };
  },

  TraceTransactionRequest(transactionHash: string): RequestArguments {
    return { method: method.traceTransaction, params: [transactionHash] };
  },

  SimulateTransactionsRequest(
    blockId: BlockId,
    transactions: BroadcastedTxn[],
    simulationFlags: SimulationFlag[] = [],
  ): RequestArguments {
    return { method: method.simulateTransactions, params: [blockId, transactions, simulationFlags] };
  },

  TraceBlockTransactionsRequest(blockId: BlockId): RequestArguments {
    return { method: method.traceBlockTransactions, params: [blockId] };
  },

  SubscribeNewHeadsRequest(params?: NewHeadsSubscriptionParams): RequestArguments {
    const requestParams = params?.block_id ? [params.block_id] : [];
    return { method: method.subscribeNewHeads, params: requestParams };
  },

  SubscribeEventsRequest(params?: EventsSubscriptionParams): RequestArguments {
    const requestParams: unknown[] = [];
    if (params) {
      requestParams.push(params.from_address ?? null);
      requestParams.push(params.keys ?? null);
      requestParams.push(params.block_id ?? null);
      if (params.finality_status !== undefined) {
        requestParams.push(params.finality_status);
      }
    }
    return { method: method.subscribeEvents, params: requestParams };
  },

  SubscribeTransactionStatusRequest(transactionHash: string): RequestArguments {
    return { method: method.subscribeTransactionStatus, params: [transactionHash] };
  },

  SubscribeNewTransactionReceiptsRequest(
    params?: TransactionReceiptsSubscriptionParams,
  ): RequestArguments {
    const requestParams: unknown[] = [];
    if (params) {
      requestParams.push(params.finality_status ?? null);
      if (params.sender_address !== undefined) {
        requestParams.push(params.sender_address);
      }
    }
    return { method: method.subscribeNewTransactionReceipts, params: requestParams };
  },

  SubscribeNewTransactionsRequest(params?: PendingTransactionsSubscriptionParams): RequestArguments {
    const requestParams: unknown[] = [];
    if (params) {
      requestParams.push(params.finality_status ?? null);
      if (params.sender_address !== undefined) {
        requestParams.push(params.sender_address);
      }
    }
    return { method: method.subscribeNewTransactions, params: requestParams };
  },

  UnsubscribeRequest(subscriptionId: string): RequestArguments {
    return { method: method.unsubscribe, params: [subscriptionId] };
  },
} as const;
