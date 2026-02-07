import { Effect } from "effect";
import type {
  ContractAddressType,
  Felt252Type,
  StorageKeyType,
} from "@kundera-sn/kundera-ts";
import type {
  AddDeclareTransactionResult,
  AddDeployAccountTransactionResult,
  AddInvokeTransactionResult,
  BlockHashAndNumber,
  BlockId,
  BlockWithReceipts,
  BlockWithTxHashes,
  BlockWithTxs,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  BroadcastedInvokeTxn,
  EventsFilter,
  EventsResponse,
  FeeEstimate,
  FunctionCall,
  SimulatedTransaction,
  SimulationFlag,
  StateUpdate,
  SyncingStatus,
  TransactionStatus,
  TxnReceiptWithBlockInfo,
  TxnWithHash,
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
): Effect.Effect<string, TransportError | RpcError, ProviderService> =>
  request("starknet_specVersion", [], options);

export const chainId = (
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> =>
  request("starknet_chainId", [], options);

export const blockNumber = (
  options?: RequestOptions,
): Effect.Effect<number, TransportError | RpcError, ProviderService> =>
  request("starknet_blockNumber", [], options);

export const blockHashAndNumber = (
  options?: RequestOptions,
): Effect.Effect<BlockHashAndNumber, TransportError | RpcError, ProviderService> =>
  request("starknet_blockHashAndNumber", [], options);

export const syncing = (
  options?: RequestOptions,
): Effect.Effect<SyncingStatus, TransportError | RpcError, ProviderService> =>
  request("starknet_syncing", [], options);

export const call = <T = string[]>(
  payload: FunctionCall,
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<T, TransportError | RpcError, ProviderService> =>
  request("starknet_call", [payload, blockId], options);

export const estimateFee = (
  requests: readonly BroadcastedInvokeTxn[],
  simulationFlags: readonly SimulationFlag[] = [],
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<FeeEstimate[], TransportError | RpcError, ProviderService> =>
  request("starknet_estimateFee", [requests, simulationFlags, blockId], options);

export const getStateUpdate = (
  blockId: BlockId,
  options?: RequestOptions,
): Effect.Effect<StateUpdate, TransportError | RpcError, ProviderService> =>
  request("starknet_getStateUpdate", [blockId], options);

export const getStorageAt = (
  contractAddress: ContractAddressType | string,
  key: StorageKeyType | Felt252Type | string,
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> =>
  request(
    "starknet_getStorageAt",
    [
      typeof contractAddress === "string"
        ? contractAddress
        : contractAddress.toHex(),
      typeof key === "string" ? key : key.toHex(),
      blockId,
    ],
    options,
  );

export const getNonce = (
  contractAddress: ContractAddressType | string,
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> =>
  request(
    "starknet_getNonce",
    [
      blockId,
      typeof contractAddress === "string"
        ? contractAddress
        : contractAddress.toHex(),
    ],
    options,
  );

export const getClassHashAt = (
  blockId: BlockId,
  contractAddress: ContractAddressType | string,
  options?: RequestOptions,
): Effect.Effect<string, TransportError | RpcError, ProviderService> =>
  request(
    "starknet_getClassHashAt",
    [
      blockId,
      typeof contractAddress === "string"
        ? contractAddress
        : contractAddress.toHex(),
    ],
    options,
  );

export const getClassAt = <T = unknown>(
  blockId: BlockId,
  contractAddress: ContractAddressType | string,
  options?: RequestOptions,
): Effect.Effect<T, TransportError | RpcError, ProviderService> =>
  request(
    "starknet_getClassAt",
    [
      blockId,
      typeof contractAddress === "string"
        ? contractAddress
        : contractAddress.toHex(),
    ],
    options,
  );

export const getBlockWithTxHashes = (
  blockId: BlockId,
  options?: RequestOptions,
): Effect.Effect<BlockWithTxHashes, TransportError | RpcError, ProviderService> =>
  request("starknet_getBlockWithTxHashes", [blockId], options);

export const getBlockWithTxs = (
  blockId: BlockId,
  options?: RequestOptions,
): Effect.Effect<BlockWithTxs, TransportError | RpcError, ProviderService> =>
  request("starknet_getBlockWithTxs", [blockId], options);

export const getBlockWithReceipts = (
  blockId: BlockId,
  options?: RequestOptions,
): Effect.Effect<BlockWithReceipts, TransportError | RpcError, ProviderService> =>
  request("starknet_getBlockWithReceipts", [blockId], options);

export const getTransactionByHash = (
  txHash: Felt252Type | string,
  options?: RequestOptions,
): Effect.Effect<TxnWithHash, TransportError | RpcError, ProviderService> =>
  request(
    "starknet_getTransactionByHash",
    [typeof txHash === "string" ? txHash : txHash.toHex()],
    options,
  );

export const getTransactionReceipt = (
  txHash: Felt252Type | string,
  options?: RequestOptions,
): Effect.Effect<TxnReceiptWithBlockInfo, TransportError | RpcError, ProviderService> =>
  request(
    "starknet_getTransactionReceipt",
    [typeof txHash === "string" ? txHash : txHash.toHex()],
    options,
  );

export const getTransactionStatus = (
  txHash: Felt252Type | string,
  options?: RequestOptions,
): Effect.Effect<TransactionStatus, TransportError | RpcError, ProviderService> =>
  request(
    "starknet_getTransactionStatus",
    [typeof txHash === "string" ? txHash : txHash.toHex()],
    options,
  );

export const getEvents = (
  filter: EventsFilter,
  options?: RequestOptions,
): Effect.Effect<EventsResponse, TransportError | RpcError, ProviderService> =>
  request("starknet_getEvents", [filter], options);

export const addInvokeTransaction = (
  tx: BroadcastedInvokeTxn,
  options?: RequestOptions,
): Effect.Effect<AddInvokeTransactionResult, TransportError | RpcError, ProviderService> =>
  request("starknet_addInvokeTransaction", [tx], options);

export const addDeclareTransaction = (
  tx: BroadcastedDeclareTxn,
  options?: RequestOptions,
): Effect.Effect<AddDeclareTransactionResult, TransportError | RpcError, ProviderService> =>
  request("starknet_addDeclareTransaction", [tx], options);

export const addDeployAccountTransaction = (
  tx: BroadcastedDeployAccountTxn,
  options?: RequestOptions,
): Effect.Effect<AddDeployAccountTransactionResult, TransportError | RpcError, ProviderService> =>
  request("starknet_addDeployAccountTransaction", [tx], options);

export const simulateTransactions = (
  txs: readonly (BroadcastedInvokeTxn | BroadcastedDeclareTxn | BroadcastedDeployAccountTxn)[],
  simulationFlags: readonly SimulationFlag[] = [],
  blockId: BlockId = "latest",
  options?: RequestOptions,
): Effect.Effect<SimulatedTransaction[], TransportError | RpcError, ProviderService> =>
  request("starknet_simulateTransactions", [blockId, txs, simulationFlags], options);
