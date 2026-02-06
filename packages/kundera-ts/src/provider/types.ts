/**
 * Provider Types
 *
 * Starknet provider types and event interfaces.
 *
 * @module provider/types
 */

import type {
	EmittedEvent,
	NewHead,
	PendingTransaction,
	ReorgData,
	TransactionStatusUpdate,
	WsTransactionReceipt,
	EventsSubscriptionParams,
	NewHeadsSubscriptionParams,
	PendingTransactionsSubscriptionParams,
	TransactionReceiptsSubscriptionParams,
} from "../jsonrpc/types.js";

/**
 * Provider request arguments (non-schema version)
 */
export interface RequestArguments {
	/** JSON-RPC method name */
	readonly method: string;
	/** Method parameters (array or object) */
	readonly params?: unknown[] | Record<string, unknown>;
}

/**
 * JSON-RPC error response
 */
export interface RpcError {
	/** Error code */
	code: number;
	/** Human-readable error message */
	message: string;
	/** Optional error data */
	data?: unknown;
}

/**
 * Optional configuration for provider requests
 */
export interface RequestOptions {
	/** Request timeout in milliseconds */
	timeout?: number;
	/** Number of retry attempts on failure */
	retryCount?: number;
	/** Delay between retries in milliseconds */
	retryDelay?: number;
}

/**
 * Provider response wrapper
 */
export interface Response<T> {
	/** Result data (undefined if error) */
	result?: T;
	/** Error data (undefined if success) */
	error?: RpcError;
}

/**
 * Provider message
 */
export interface ProviderMessage {
	/** Message type identifier */
	readonly type: string;
	/** Message payload */
	readonly data: unknown;
}

/**
 * Chain connection info
 */
export interface ProviderConnectInfo {
	/** Chain ID as string (starknet_chainId) */
	chainId: string;
}

/**
 * Provider event map (EIP-1193-inspired)
 */
export interface ProviderEventMap
	extends Record<string, (...args: any[]) => void> {
	/** Emitted when accounts change */
	accountsChanged(accounts: string[]): void;
	/** Emitted when chain changes */
	chainChanged(chainId: string): void;
	/** Emitted when provider connects */
	connect(connectInfo: ProviderConnectInfo): void;
	/** Emitted when provider disconnects */
	disconnect(error: RpcError): void;
	/** Emitted for custom messages */
	message(message: ProviderMessage): void;
}

/**
 * Event names for provider
 */
export type ProviderEvent = keyof ProviderEventMap;

/**
 * Starknet WebSocket subscription helpers
 */
export interface ProviderEvents {
	/** Subscribe to new block headers */
	newHeads: (
		params?: NewHeadsSubscriptionParams,
	) => AsyncGenerator<NewHead | ReorgData, void, unknown>;
	/** Subscribe to events */
	events: (
		params?: EventsSubscriptionParams,
	) => AsyncGenerator<EmittedEvent | ReorgData, void, unknown>;
	/** Subscribe to pending transactions */
	pendingTransactions: (
		params?: PendingTransactionsSubscriptionParams,
	) => AsyncGenerator<PendingTransaction | ReorgData, void, unknown>;
	/** Subscribe to transaction receipts */
	transactionReceipts: (
		params?: TransactionReceiptsSubscriptionParams,
	) => AsyncGenerator<WsTransactionReceipt | ReorgData, void, unknown>;
	/** Subscribe to transaction status updates */
	transactionStatus: (
		transactionHash: string,
	) => AsyncGenerator<TransactionStatusUpdate | ReorgData, void, unknown>;
}
