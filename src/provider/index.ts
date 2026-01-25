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
  TransactionReceipt,
  TransactionReceiptsSubscriptionParams,
  ReorgData,
  // Finality status types
  TxnFinalityStatusWithoutL1,
  ReceiptFinalityStatus,
  // Result types
  FeeEstimate,
  MessageFeeEstimate,
  SyncingStatus,
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
