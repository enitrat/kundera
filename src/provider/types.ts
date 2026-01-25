/**
 * Provider Types
 *
 * Starknet JSON-RPC provider types, mirroring Voltaire patterns.
 *
 * @module provider/types
 */

/**
 * JSON-RPC request arguments
 */
export interface RequestArguments {
  /** JSON-RPC method name */
  readonly method: string;
  /** Method parameters (array or object) */
  readonly params?: readonly unknown[] | object;
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
 * Starknet-specific error codes
 */
export enum StarknetRpcErrorCode {
  /** Failed to write to transaction pool */
  FailedToReceiveTransaction = 1,
  /** Contract not found */
  ContractNotFound = 20,
  /** Block not found */
  BlockNotFound = 24,
  /** Transaction hash not found */
  InvalidTransactionHash = 25,
  /** Invalid transaction index */
  InvalidTransactionIndex = 27,
  /** Class hash not found */
  ClassHashNotFound = 28,
  /** Transaction hash not found in pending transactions */
  TransactionHashNotFound = 29,
  /** Requested page size too big */
  PageSizeTooBig = 31,
  /** No blocks */
  NoBlocks = 32,
  /** Invalid continuation token */
  InvalidContinuationToken = 33,
  /** Too many keys in filter */
  TooManyKeysInFilter = 34,
  /** Contract error */
  ContractError = 40,
  /** Transaction execution error */
  TransactionExecutionError = 41,
  /** Invalid contract class */
  InvalidContractClass = 50,
  /** Class already declared */
  ClassAlreadyDeclared = 51,
  /** Invalid transaction nonce */
  InvalidTransactionNonce = 52,
  /** Max fee too small */
  InsufficientMaxFee = 53,
  /** Account balance too small */
  InsufficientAccountBalance = 54,
  /** Account validation failed */
  ValidationFailure = 55,
  /** Compilation failed */
  CompilationFailed = 56,
  /** Contract class size is too large */
  ContractClassSizeIsTooLarge = 57,
  /** Non-account calls are not supported */
  NonAccount = 58,
  /** Transaction with same hash already exists */
  DuplicateTransaction = 59,
  /** Compiled class hash did not match */
  CompiledClassHashMismatch = 60,
  /** Unsupported transaction version */
  UnsupportedTransactionVersion = 61,
  /** Unsupported contract class version */
  UnsupportedContractClassVersion = 62,
  /** Unexpected error */
  UnexpectedError = 63,
  /** No trace available */
  NoTraceAvailable = 10,
}

/**
 * Optional configuration for provider requests
 */
export interface RequestOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts on failure */
  retry?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
}

/**
 * Block tag for specifying block context
 */
export type BlockTag = 'latest' | 'pending';

/**
 * Block identifier
 */
export type BlockId =
  | BlockTag
  | { block_number: number }
  | { block_hash: string };

/**
 * Provider event listener
 */
export type ProviderEventListener = (...args: unknown[]) => void;

/**
 * Provider connect info
 */
export interface ProviderConnectInfo {
  /** Chain ID as hex string */
  chainId: string;
}

/**
 * Provider events
 */
export interface ProviderEventMap {
  /** Emitted when provider connects */
  connect: [connectInfo: ProviderConnectInfo];
  /** Emitted when provider disconnects */
  disconnect: [error: RpcError];
  /** Emitted for custom messages */
  message: [message: { type: string; data: unknown }];
}

/**
 * Event names for provider
 */
export type ProviderEvent = keyof ProviderEventMap;

/**
 * JSON-RPC response wrapper (non-throwing pattern)
 */
export interface Response<T> {
  /** Result data (undefined if error) */
  result?: T;
  /** Error data (undefined if success) */
  error?: RpcError;
}

/**
 * Starknet WebSocket subscription events
 */
export interface StarknetProviderEvents {
  /** Subscribe to new block headers (params: block_id?) */
  newHeads: (
    params?: NewHeadsSubscriptionParams,
  ) => AsyncGenerator<NewHead, void, unknown>;
  /** Subscribe to events (params: from_address?, keys?, block_id?) */
  events: (
    params?: EventsSubscriptionParams,
  ) => AsyncGenerator<EmittedEvent, void, unknown>;
  /** Subscribe to transaction status changes */
  transactionStatus: (
    transactionHash: string,
  ) => AsyncGenerator<TransactionStatusUpdate, void, unknown>;
  /** Subscribe to pending transactions (params: sender_address?, finality_status?) */
  pendingTransactions: (
    params?: PendingTransactionsSubscriptionParams,
  ) => AsyncGenerator<PendingTransaction, void, unknown>;
  /** Subscribe to new transaction receipts (params: sender_address?, finality_status?) */
  newTransactionReceipts: (
    params?: TransactionReceiptsSubscriptionParams,
  ) => AsyncGenerator<TransactionReceipt, void, unknown>;
  /** Subscribe to reorg events */
  reorg: () => AsyncGenerator<ReorgData, void, unknown>;
}

// ============ Starknet-specific Types ============

/**
 * New block header from subscription
 */
export interface NewHead {
  block_hash: string;
  parent_hash: string;
  block_number: number;
  new_root: string;
  timestamp: number;
  sequencer_address: string;
  l1_gas_price: ResourcePrice;
  l1_data_gas_price: ResourcePrice;
  l1_da_mode: 'BLOB' | 'CALLDATA';
  starknet_version: string;
}

/**
 * Resource price
 */
export interface ResourcePrice {
  price_in_fri: string;
  price_in_wei: string;
}

/**
 * Emitted event from subscription
 */
export interface EmittedEvent {
  block_hash: string;
  block_number: number;
  transaction_hash: string;
  from_address: string;
  keys: string[];
  data: string[];
}

/**
 * Transaction finality status without L1 (for WS subscriptions)
 * TXN_STATUS_WITHOUT_L1 per Starknet spec
 */
export type TxnFinalityStatusWithoutL1 =
  | 'RECEIVED'
  | 'CANDIDATE'
  | 'PRE_CONFIRMED'
  | 'ACCEPTED_ON_L2';

/**
 * Transaction finality status for receipts subscription
 * Only PRE_CONFIRMED or ACCEPTED_ON_L2 allowed per spec
 */
export type ReceiptFinalityStatus = 'PRE_CONFIRMED' | 'ACCEPTED_ON_L2';

/**
 * Events subscription parameters (positional: from_address?, keys?, block_id?, finality_status?)
 */
export interface EventsSubscriptionParams {
  from_address?: string;
  keys?: string[][];
  block_id?: BlockId;
  finality_status?: TxnFinalityStatusWithoutL1;
}

/**
 * Transaction status update from subscription
 */
export interface TransactionStatusUpdate {
  transaction_hash: string;
  status: {
    finality_status: 'RECEIVED' | 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1';
    execution_status?: 'SUCCEEDED' | 'REVERTED';
    failure_reason?: string;
  };
}

/**
 * Pending transaction from subscription
 */
export interface PendingTransaction {
  transaction_hash: string;
  sender_address?: string;
  // Additional fields depending on transaction type
  [key: string]: unknown;
}

/**
 * Pending transactions subscription parameters (positional: finality_status?, sender_address?)
 */
export interface PendingTransactionsSubscriptionParams {
  finality_status?: TxnFinalityStatusWithoutL1;
  sender_address?: string[];
}

/**
 * New heads subscription parameters (positional: block_id?)
 */
export interface NewHeadsSubscriptionParams {
  block_id?: BlockId;
}

/**
 * Transaction receipts subscription parameters (positional: finality_status?, sender_address?)
 */
export interface TransactionReceiptsSubscriptionParams {
  finality_status?: ReceiptFinalityStatus;
  sender_address?: string[];
}

/**
 * Transaction receipt from subscription
 */
export interface TransactionReceipt {
  transaction_hash: string;
  actual_fee: { amount: string; unit: 'WEI' | 'FRI' };
  execution_status: 'SUCCEEDED' | 'REVERTED';
  finality_status: 'RECEIVED' | 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1';
  block_hash?: string;
  block_number?: number;
  messages_sent: unknown[];
  events: unknown[];
  execution_resources?: unknown;
  revert_reason?: string;
}

/**
 * Reorg data from subscription
 */
export interface ReorgData {
  starting_block_hash: string;
  starting_block_number: number;
  ending_block_hash: string;
  ending_block_number: number;
}

/**
 * Function call request
 */
export interface FunctionCall {
  contract_address: string;
  entry_point_selector: string;
  calldata: string[];
}

/**
 * Simulation flag
 */
export type SimulationFlag = 'SKIP_VALIDATE' | 'SKIP_FEE_CHARGE';

/**
 * Fee estimate
 */
export interface FeeEstimate {
  gas_consumed: string;
  gas_price: string;
  data_gas_consumed: string;
  data_gas_price: string;
  overall_fee: string;
  unit: 'WEI' | 'FRI';
}

/**
 * Message fee estimate
 */
export interface MessageFeeEstimate {
  gas_consumed: string;
  gas_price: string;
  overall_fee: string;
  unit: 'WEI' | 'FRI';
}

/**
 * Syncing status
 */
export type SyncingStatus =
  | false
  | {
      starting_block_hash: string;
      starting_block_num: number;
      current_block_hash: string;
      current_block_num: number;
      highest_block_hash: string;
      highest_block_num: number;
    };
