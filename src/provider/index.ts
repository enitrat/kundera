/**
 * Starknet Provider Module
 *
 * JSON-RPC providers for Starknet, supporting HTTP and WebSocket transports.
 * Follows EIP-1193-like patterns with TypedProvider for type-safe calls.
 *
 * @module provider
 */

// Provider interface
export { type Provider } from './Provider.js';

// HTTP Provider
export { HttpProvider, type HttpProviderOptions } from './HttpProvider.js';

// WebSocket Provider
export {
  WebSocketProvider,
  type WebSocketProviderOptions,
} from './WebSocketProvider.js';

// Typed Provider
export { TypedProvider, createTypedProvider } from './TypedProvider.js';

// RPC Schema utilities
export type {
  RpcSchema,
  RpcSchemaEntry,
  RpcMethodNames,
  RpcMethodParameters,
  RpcMethodReturnType,
  EIP1193RequestFn,
  SchemaRequestArguments,
} from './RpcSchema.js';

// Starknet RPC Schema
export type { StarknetRpcSchema } from './StarknetRpcSchema.js';

// Types (note: BlockId, BlockTag, FunctionCall, RpcError also exported from rpc module)
export type {
  // Core types
  RequestArguments,
  RequestOptions,
  Response,
  SimulationFlag,
  // Provider events
  ProviderEvent,
  ProviderEventMap,
  ProviderEventListener,
  ProviderConnectInfo,
  // Starknet provider events (WS subscriptions)
  StarknetProviderEvents,
  NewHead,
  NewHeadsSubscriptionParams,
  ResourcePrice,
  EmittedEvent,
  EventsSubscriptionParams,
  TransactionStatusUpdate,
  PendingTransaction,
  PendingTransactionsSubscriptionParams,
  WsTransactionReceipt,
  TransactionReceiptsSubscriptionParams,
  ReorgData,
  // Finality status types
  TxnFinalityStatusWithoutL1,
  ReceiptFinalityStatus,
  // Result types
  FeeEstimate,
  MessageFeeEstimate,
  SyncingStatus,
  // Block types (full OpenRPC spec types)
  BlockStatus,
  BlockHeader,
  BlockHeaderWithCommitments,
  BlockWithTxHashes,
  BlockWithTxs,
  BlockWithReceipts,
  PreConfirmedBlockWithTxHashes,
  PreConfirmedBlockWithTxs,
  PreConfirmedBlockWithReceipts,
  // Transaction types
  DAMode,
  ResourceBounds,
  ResourceBoundsMapping,
  InvokeTxnV0,
  InvokeTxnV1,
  InvokeTxnV3,
  InvokeTxn,
  L1HandlerTxn,
  DeclareTxnV0,
  DeclareTxnV1,
  DeclareTxnV2,
  DeclareTxnV3,
  DeclareTxn,
  DeployTxn,
  DeployAccountTxnV1,
  DeployAccountTxnV3,
  DeployAccountTxn,
  Txn,
  TxnWithHash,
  // Transaction receipt types
  TxnFinalityStatus,
  TxnExecutionStatus,
  FeePayment,
  MsgToL1,
  Event,
  ExecutionResources,
  TxnReceiptCommon,
  InvokeTxnReceipt,
  L1HandlerTxnReceipt,
  DeclareTxnReceipt,
  DeployTxnReceipt,
  DeployAccountTxnReceipt,
  TxnReceipt,
  TxnReceiptWithBlockInfo,
  // State update types
  ContractStorageDiffItem,
  DeployedContractItem,
  DeclaredClassItem,
  ReplacedClassItem,
  NonceUpdateItem,
  StateDiff,
  StateUpdate,
  PreConfirmedStateUpdate,
  // Contract class types (full OpenRPC spec types)
  SierraEntryPoint,
  SierraEntryPointsByType,
  ContractClass,
  DeprecatedEntryPoint,
  DeprecatedEntryPointsByType,
  DeprecatedContractClass,
  ContractClassResponse,
  // Message types
  MsgFromL1,
  MessageStatus,
  MessagesStatusResponse,
  // Storage proof types
  MerkleNode,
  ContractLeafData,
  StorageProof,
  // Events types
  EventsResponse,
  // Trace types
  CallType,
  EntryPointType,
  OrderedEvent,
  OrderedMessage,
  ComputationResources,
  InnerCallExecutionResources,
  FunctionInvocation,
  RevertibleFunctionInvocation,
  InvokeTxnTrace,
  DeclareTxnTrace,
  DeployAccountTxnTrace,
  L1HandlerTxnTrace,
  TransactionTrace,
  BlockTransactionTrace,
  SimulatedTransaction,
  // Broadcasted transaction types
  BroadcastedInvokeTxn,
  BroadcastedDeclareTxnV2,
  BroadcastedDeclareTxnV3,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  BroadcastedTxn,
  // Transaction status (full OpenRPC spec type)
  TransactionStatus,
} from './types.js';

// Re-export types that are also in rpc module for convenience
// (users of provider module don't need to import from rpc separately)
export type {
  RpcError as ProviderRpcError,
  BlockTag as ProviderBlockTag,
  BlockId as ProviderBlockId,
  FunctionCall as ProviderFunctionCall,
} from './types.js';

// Error codes
export { StarknetRpcErrorCode } from './types.js';

// ============ Factory Functions ============

import { HttpProvider } from './HttpProvider.js';
import type { HttpProviderOptions } from './HttpProvider.js';

/**
 * Create a new HTTP provider
 */
export function createHttpProvider(
  options: HttpProviderOptions | string,
): HttpProvider {
  return new HttpProvider(options);
}

/**
 * Create HTTP provider for Starknet mainnet
 */
export function mainnetProvider(
  options?: Omit<HttpProviderOptions, 'url'>,
): HttpProvider {
  return new HttpProvider({
    url: 'https://starknet-mainnet.public.blastapi.io',
    ...options,
  });
}

/**
 * Create HTTP provider for Starknet Sepolia testnet
 */
export function sepoliaProvider(
  options?: Omit<HttpProviderOptions, 'url'>,
): HttpProvider {
  return new HttpProvider({
    url: 'https://starknet-sepolia.public.blastapi.io',
    ...options,
  });
}
