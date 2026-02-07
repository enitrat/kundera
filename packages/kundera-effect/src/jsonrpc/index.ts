import { Effect } from "effect";
import type {
  ContractAddressType,
  Felt252Type,
  StorageKeyType,
} from "@kundera-sn/kundera-ts";
import {
  Rpc,
  type AddDeclareTransactionResult,
  type AddDeployAccountTransactionResult,
  type AddInvokeTransactionResult,
  type BlockHashAndNumber,
  type BlockId,
  type BlockWithReceipts,
  type BlockWithTxHashes,
  type BlockWithTxs,
  type BroadcastedDeclareTxn,
  type BroadcastedDeployAccountTxn,
  type BroadcastedInvokeTxn,
  type EventsFilter,
  type EventsResponse,
  type FeeEstimate,
  type FunctionCall,
  type SimulatedTransaction,
  type SimulationFlag,
  type StateUpdate,
  type SyncingStatus,
  type TransactionStatus,
  type TxnReceiptWithBlockInfo,
  type TxnWithHash,
} from "@kundera-sn/kundera-ts/jsonrpc";

import type { RpcError, TransportError } from "../errors.js";
import { ProviderService } from "../services/ProviderService.js";
import type { RequestOptions } from "../services/TransportService.js";

export const request = <T>(
  method: string,
  params?: readonly unknown[],
  options?: RequestOptions,
): Effect.Effect<T, TransportError | RpcError, ProviderService> =>
  Effect.flatMap(ProviderService, (provider) =>
    provider.request<T>(method, params, options),
  );

export const specVersion = (
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.SpecVersionRequest();
  return request(method, params, options);
};

export const chainId = (
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.ChainIdRequest();
  return request(method, params, options);
};

export const blockNumber = (
  options?: RequestOptions,
): Effect.Effect<number, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.BlockNumberRequest();
  return request(method, params, options);
};

export const blockHashAndNumber = (
  options?: RequestOptions,
): Effect.Effect<BlockHashAndNumber, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.BlockHashAndNumberRequest();
  return request(method, params, options);
};

export const syncing = (
  options?: RequestOptions,
): Effect.Effect<SyncingStatus, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.SyncingRequest();
  return request(method, params, options);
};

export const call = <T = string[]>(
  payload: FunctionCall,
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<T, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.CallRequest(payload, blockId);
  return request(method, params, options);
};

export const estimateFee = (
  requests: readonly BroadcastedInvokeTxn[],
  simulationFlags: readonly SimulationFlag[] = [],
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<FeeEstimate[], TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.EstimateFeeRequest(
    [...requests],
    [...simulationFlags],
    blockId,
  );
  return request(method, params, options);
};

export const getStateUpdate = (
  blockId: BlockId,
  options?: RequestOptions,
): Effect.Effect<StateUpdate, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetStateUpdateRequest(blockId);
  return request(method, params, options);
};

export const getStorageAt = (
  contractAddress: ContractAddressType,
  key: StorageKeyType,
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetStorageAtRequest(
    contractAddress.toHex(),
    key.toHex(),
    blockId,
  );
  return request(method, params, options);
};

export const getNonce = (
  contractAddress: ContractAddressType,
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetNonceRequest(blockId, contractAddress.toHex());
  return request(method, params, options);
};

export const getClassHashAt = (
  blockId: BlockId,
  contractAddress: ContractAddressType,
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetClassHashAtRequest(blockId, contractAddress.toHex());
  return request(method, params, options);
};

export const getClassAt = <T = unknown>(
  blockId: BlockId,
  contractAddress: ContractAddressType,
  options?: RequestOptions,
): Effect.Effect<T, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetClassAtRequest(blockId, contractAddress.toHex());
  return request(method, params, options);
};

export const getBlockWithTxHashes = (
  blockId: BlockId,
  options?: RequestOptions,
): Effect.Effect<BlockWithTxHashes, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetBlockWithTxHashesRequest(blockId);
  return request(method, params, options);
};

export const getBlockWithTxs = (
  blockId: BlockId,
  options?: RequestOptions,
): Effect.Effect<BlockWithTxs, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetBlockWithTxsRequest(blockId);
  return request(method, params, options);
};

export const getBlockWithReceipts = (
  blockId: BlockId,
  options?: RequestOptions,
): Effect.Effect<BlockWithReceipts, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetBlockWithReceiptsRequest(blockId);
  return request(method, params, options);
};

export const getTransactionByHash = (
  txHash: Felt252Type,
  options?: RequestOptions,
): Effect.Effect<TxnWithHash, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetTransactionByHashRequest(txHash.toHex());
  return request(method, params, options);
};

export const getTransactionReceipt = (
  txHash: Felt252Type,
  options?: RequestOptions,
): Effect.Effect<TxnReceiptWithBlockInfo, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetTransactionReceiptRequest(txHash.toHex());
  return request(method, params, options);
};

export const getTransactionStatus = (
  txHash: Felt252Type,
  options?: RequestOptions,
): Effect.Effect<TransactionStatus, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetTransactionStatusRequest(txHash.toHex());
  return request(method, params, options);
};

export const getEvents = (
  filter: EventsFilter,
  options?: RequestOptions,
): Effect.Effect<EventsResponse, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.GetEventsRequest(filter);
  return request(method, params, options);
};

export const addInvokeTransaction = (
  tx: BroadcastedInvokeTxn,
  options?: RequestOptions,
): Effect.Effect<AddInvokeTransactionResult, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.AddInvokeTransactionRequest(tx);
  return request(method, params, options);
};

export const addDeclareTransaction = (
  tx: BroadcastedDeclareTxn,
  options?: RequestOptions,
): Effect.Effect<AddDeclareTransactionResult, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.AddDeclareTransactionRequest(tx);
  return request(method, params, options);
};

export const addDeployAccountTransaction = (
  tx: BroadcastedDeployAccountTxn,
  options?: RequestOptions,
): Effect.Effect<AddDeployAccountTransactionResult, TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.AddDeployAccountTransactionRequest(tx);
  return request(method, params, options);
};

export const simulateTransactions = (
  txs: readonly (BroadcastedInvokeTxn | BroadcastedDeclareTxn | BroadcastedDeployAccountTxn)[],
  simulationFlags: readonly SimulationFlag[] = [],
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<SimulatedTransaction[], TransportError | RpcError, ProviderService> => {
  const { method, params } = Rpc.SimulateTransactionsRequest(
    blockId,
    [...txs],
    [...simulationFlags],
  );
  return request(method, params, options);
};
