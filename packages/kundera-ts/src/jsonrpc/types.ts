/**
 * RPC Types
 *
 * Starknet JSON-RPC types based on the OpenRPC specification.
 *
 * @module rpc/types
 */

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

export type { BlockHashAndNumber } from './methods/blockHashAndNumber.js';
export interface EventsFilter {
  from_block?: BlockId;
  to_block?: BlockId;
  address?: string;
  keys?: string[][];
  continuation_token?: string;
  chunk_size: number;
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
 * Transaction receipt from subscription (WS)
 */
export interface WsTransactionReceipt {
  transaction_hash: string;
  actual_fee: { amount: string; unit: 'WEI' | 'FRI' };
  execution_status: 'SUCCEEDED' | 'REVERTED';
  finality_status: 'RECEIVED' | 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1';
  block_hash?: string;
  block_number?: number;
  messages_sent: MsgToL1[];
  events: Event[];
  execution_resources?: ExecutionResources;
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

// ============================================================================
// Block Types (starknet_api_openrpc.json)
// ============================================================================

/**
 * Block status
 */
export type BlockStatus =
  | 'ACCEPTED_ON_L1'
  | 'ACCEPTED_ON_L2'
  | 'PENDING'
  | 'REJECTED';

/**
 * Block header fields (shared by all block types)
 */
export interface BlockHeader {
  block_hash: string;
  parent_hash: string;
  block_number: number;
  new_root: string;
  timestamp: number;
  sequencer_address: string;
  l1_gas_price: ResourcePrice;
  l2_gas_price: ResourcePrice;
  l1_data_gas_price: ResourcePrice;
  l1_da_mode: 'BLOB' | 'CALLDATA';
  starknet_version: string;
}

/**
 * Extended block header with commitment fields
 */
export interface BlockHeaderWithCommitments extends BlockHeader {
  event_commitment: string;
  transaction_commitment: string;
  receipt_commitment: string;
  state_diff_commitment: string;
  event_count: number;
  transaction_count: number;
  state_diff_length: number;
}

/**
 * Block with transaction hashes
 */
export interface BlockWithTxHashes extends BlockHeaderWithCommitments {
  status: BlockStatus;
  transactions: string[];
}

/**
 * Pre-confirmed block with transaction hashes (pending)
 */
export interface PreConfirmedBlockWithTxHashes extends BlockHeader {
  transactions: string[];
  sequencer_address: string;
}

/**
 * Block with full transactions
 */
export interface BlockWithTxs extends BlockHeaderWithCommitments {
  status: BlockStatus;
  transactions: TxnWithHash[];
}

/**
 * Pre-confirmed block with full transactions (pending)
 */
export interface PreConfirmedBlockWithTxs extends BlockHeader {
  transactions: TxnWithHash[];
}

/**
 * Transaction with receipt pair
 */
export interface TxnWithReceipt {
  transaction: Txn;
  receipt: TxnReceipt;
}

/**
 * Block with receipts
 */
export interface BlockWithReceipts extends BlockHeaderWithCommitments {
  status: BlockStatus;
  transactions: TxnWithReceipt[];
}

/**
 * Pre-confirmed block with receipts (pending)
 */
export interface PreConfirmedBlockWithReceipts extends BlockHeader {
  transactions: TxnWithReceipt[];
}

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Data availability mode
 */
export type DAMode = 'L1' | 'L2';

/**
 * Resource bounds for a resource type
 */
export interface ResourceBounds {
  max_amount: string;
  max_price_per_unit: string;
}

/**
 * Resource bounds mapping
 */
export interface ResourceBoundsMapping {
  l1_gas: ResourceBounds;
  l2_gas: ResourceBounds;
}

/**
 * Invoke transaction V0
 */
export interface InvokeTxnV0 {
  type: 'INVOKE';
  version: '0x0' | '0x100000000000000000000000000000000';
  max_fee: string;
  signature: string[];
  contract_address: string;
  entry_point_selector: string;
  calldata: string[];
}

/**
 * Invoke transaction V1
 */
export interface InvokeTxnV1 {
  type: 'INVOKE';
  version: '0x1' | '0x100000000000000000000000000000001';
  sender_address: string;
  calldata: string[];
  max_fee: string;
  signature: string[];
  nonce: string;
}

/**
 * Invoke transaction V3
 */
export interface InvokeTxnV3 {
  type: 'INVOKE';
  version: '0x3' | '0x100000000000000000000000000000003';
  sender_address: string;
  calldata: string[];
  signature: string[];
  nonce: string;
  resource_bounds: ResourceBoundsMapping;
  tip: string;
  paymaster_data: string[];
  account_deployment_data: string[];
  nonce_data_availability_mode: DAMode;
  fee_data_availability_mode: DAMode;
}

/**
 * Invoke transaction (all versions)
 */
export type InvokeTxn = InvokeTxnV0 | InvokeTxnV1 | InvokeTxnV3;

/**
 * L1 handler transaction
 */
export interface L1HandlerTxn {
  type: 'L1_HANDLER';
  version: '0x0';
  nonce: string;
  contract_address: string;
  entry_point_selector: string;
  calldata: string[];
}

/**
 * Declare transaction V0
 */
export interface DeclareTxnV0 {
  type: 'DECLARE';
  version: '0x0' | '0x100000000000000000000000000000000';
  sender_address: string;
  max_fee: string;
  signature: string[];
  class_hash: string;
}

/**
 * Declare transaction V1
 */
export interface DeclareTxnV1 {
  type: 'DECLARE';
  version: '0x1' | '0x100000000000000000000000000000001';
  sender_address: string;
  max_fee: string;
  signature: string[];
  nonce: string;
  class_hash: string;
}

/**
 * Declare transaction V2
 */
export interface DeclareTxnV2 {
  type: 'DECLARE';
  version: '0x2' | '0x100000000000000000000000000000002';
  sender_address: string;
  compiled_class_hash: string;
  max_fee: string;
  signature: string[];
  nonce: string;
  class_hash: string;
}

/**
 * Declare transaction V3
 */
export interface DeclareTxnV3 {
  type: 'DECLARE';
  version: '0x3' | '0x100000000000000000000000000000003';
  sender_address: string;
  compiled_class_hash: string;
  signature: string[];
  nonce: string;
  class_hash: string;
  resource_bounds: ResourceBoundsMapping;
  tip: string;
  paymaster_data: string[];
  account_deployment_data: string[];
  nonce_data_availability_mode: DAMode;
  fee_data_availability_mode: DAMode;
}

/**
 * Declare transaction (all versions)
 */
export type DeclareTxn = DeclareTxnV0 | DeclareTxnV1 | DeclareTxnV2 | DeclareTxnV3;


/**
 * Deploy account transaction V1
 */
export interface DeployAccountTxnV1 {
  type: 'DEPLOY_ACCOUNT';
  version: '0x1' | '0x100000000000000000000000000000001';
  max_fee: string;
  signature: string[];
  nonce: string;
  contract_address_salt: string;
  constructor_calldata: string[];
  class_hash: string;
}

/**
 * Deploy account transaction V3
 */
export interface DeployAccountTxnV3 {
  type: 'DEPLOY_ACCOUNT';
  version: '0x3' | '0x100000000000000000000000000000003';
  signature: string[];
  nonce: string;
  contract_address_salt: string;
  constructor_calldata: string[];
  class_hash: string;
  resource_bounds: ResourceBoundsMapping;
  tip: string;
  paymaster_data: string[];
  nonce_data_availability_mode: DAMode;
  fee_data_availability_mode: DAMode;
}

/**
 * Deploy account transaction (all versions)
 */
export type DeployAccountTxn = DeployAccountTxnV1 | DeployAccountTxnV3;

/**
 * Transaction union type
 */
export type Txn =
  | InvokeTxn
  | L1HandlerTxn
  | DeclareTxn
  | DeployAccountTxn;

/**
 * Transaction with hash (as returned by getTransactionByHash)
 */
export type TxnWithHash = Txn & { transaction_hash: string };

// ============================================================================
// Transaction Receipt Types
// ============================================================================

/**
 * Transaction finality status
 */
export type TxnFinalityStatus = 'ACCEPTED_ON_L1' | 'ACCEPTED_ON_L2';

/**
 * Transaction execution status
 */
export type TxnExecutionStatus = 'SUCCEEDED' | 'REVERTED';

/**
 * Fee payment
 */
export interface FeePayment {
  amount: string;
  unit: 'WEI' | 'FRI';
}

/**
 * Message sent to L1
 */
export interface MsgToL1 {
  from_address: string;
  to_address: string;
  payload: string[];
}

/**
 * Event emitted by a contract
 */
export interface Event {
  from_address: string;
  keys: string[];
  data: string[];
}

/**
 * Execution resources
 */
export interface ExecutionResources {
  steps: number;
  memory_holes?: number;
  range_check_builtin_applications?: number;
  pedersen_builtin_applications?: number;
  poseidon_builtin_applications?: number;
  ec_op_builtin_applications?: number;
  ecdsa_builtin_applications?: number;
  bitwise_builtin_applications?: number;
  keccak_builtin_applications?: number;
  segment_arena_builtin?: number;
  data_availability?: {
    l1_gas: number;
    l1_data_gas: number;
  };
}

/**
 * Common transaction receipt fields
 */
export interface TxnReceiptCommon {
  transaction_hash: string;
  actual_fee: FeePayment;
  finality_status: TxnFinalityStatus;
  messages_sent: MsgToL1[];
  events: Event[];
  execution_resources: ExecutionResources;
  execution_status: TxnExecutionStatus;
  revert_reason?: string;
}

/**
 * Invoke transaction receipt
 */
export interface InvokeTxnReceipt extends TxnReceiptCommon {
  type: 'INVOKE';
}

/**
 * L1 handler transaction receipt
 */
export interface L1HandlerTxnReceipt extends TxnReceiptCommon {
  type: 'L1_HANDLER';
  message_hash: string;
}

/**
 * Declare transaction receipt
 */
export interface DeclareTxnReceipt extends TxnReceiptCommon {
  type: 'DECLARE';
}

/**
 * Deploy account transaction receipt
 */
export interface DeployAccountTxnReceipt extends TxnReceiptCommon {
  type: 'DEPLOY_ACCOUNT';
  contract_address: string;
}

/**
 * Transaction receipt union type
 */
export type TxnReceipt =
  | InvokeTxnReceipt
  | L1HandlerTxnReceipt
  | DeclareTxnReceipt
  | DeployAccountTxnReceipt;

/**
 * Transaction receipt with block info (as returned by getTransactionReceipt)
 */
export type TxnReceiptWithBlockInfo = TxnReceipt & {
  block_hash?: string;
  block_number?: number;
};

// ============================================================================
// State Update Types
// ============================================================================

/**
 * Contract storage diff item
 */
export interface ContractStorageDiffItem {
  address: string;
  storage_entries: { key: string; value: string }[];
}

/**
 * Deployed contract item
 */
export interface DeployedContractItem {
  address: string;
  class_hash: string;
}

/**
 * Declared class item
 */
export interface DeclaredClassItem {
  class_hash: string;
  compiled_class_hash: string;
}

/**
 * Replaced class item
 */
export interface ReplacedClassItem {
  contract_address: string;
  class_hash: string;
}

/**
 * Nonce update item
 */
export interface NonceUpdateItem {
  contract_address: string;
  nonce: string;
}

/**
 * State diff
 */
export interface StateDiff {
  storage_diffs: ContractStorageDiffItem[];
  declared_classes: DeclaredClassItem[];
  deployed_contracts: DeployedContractItem[];
  replaced_classes: ReplacedClassItem[];
  nonces: NonceUpdateItem[];
}

/**
 * State update
 */
export interface StateUpdate {
  block_hash: string;
  old_root: string;
  new_root: string;
  state_diff: StateDiff;
}

/**
 * Pre-confirmed state update (pending)
 */
export interface PreConfirmedStateUpdate {
  old_root: string;
  state_diff: StateDiff;
}

// ============================================================================
// Contract Class Types
// ============================================================================

/**
 * Sierra entry point
 */
export interface SierraEntryPoint {
  selector: string;
  function_idx: number;
}

/**
 * Sierra entry points by type
 */
export interface SierraEntryPointsByType {
  CONSTRUCTOR: SierraEntryPoint[];
  EXTERNAL: SierraEntryPoint[];
  L1_HANDLER: SierraEntryPoint[];
}

/**
 * Contract class (Sierra)
 */
export interface ContractClass {
  sierra_program: string[];
  contract_class_version: string;
  entry_points_by_type: SierraEntryPointsByType;
  abi?: string;
}


// ============================================================================
// Message Types
// ============================================================================

/**
 * Message from L1
 */
export interface MsgFromL1 {
  from_address: string;
  to_address: string;
  entry_point_selector: string;
  payload: string[];
}

/**
 * Message status
 */
export interface MessageStatus {
  transaction_hash: string;
  finality_status: TxnFinalityStatus;
  execution_status?: TxnExecutionStatus;
  failure_reason?: string;
}

/**
 * Messages status response
 */
export type MessagesStatusResponse = MessageStatus[];

// ============================================================================
// Storage Proof Types
// ============================================================================

/**
 * Merkle node
 */
export interface MerkleNode {
  node_hash: string;
  [key: string]: string; // Additional edge/binary properties
}

/**
 * Contract leaf data
 */
export interface ContractLeafData {
  nonce: string;
  class_hash: string;
}

/**
 * Storage proof
 */
export interface StorageProof {
  classes_proof: MerkleNode[];
  contracts_proof: {
    nodes: MerkleNode[];
    contract_leaves_data: ContractLeafData[];
  };
  contracts_storage_proofs: MerkleNode[][];
  global_roots: {
    contracts_tree_root: string;
    classes_tree_root: string;
    block_hash: string;
  };
}

// ============================================================================
// Events Types
// ============================================================================

/**
 * Emitted event (from getEvents)
 */
export interface EmittedEvent extends Event {
  block_hash: string;
  block_number: number;
  transaction_hash: string;
}

/**
 * Events response
 */
export interface EventsResponse {
  events: EmittedEvent[];
  continuation_token?: string;
}

// ============================================================================
// Trace Types (starknet_trace_api_openrpc.json)
// ============================================================================

/**
 * Call type in function invocation
 */
export type CallType = 'CALL' | 'DELEGATE' | 'LIBRARY_CALL';

/**
 * Entry point type
 */
export type EntryPointType = 'CONSTRUCTOR' | 'EXTERNAL' | 'L1_HANDLER';

/**
 * Ordered event
 */
export interface OrderedEvent {
  order: number;
  keys: string[];
  data: string[];
}

/**
 * Ordered message
 */
export interface OrderedMessage {
  order: number;
  to_address: string;
  payload: string[];
}

/**
 * Computation resources
 */
export interface ComputationResources {
  steps: number;
  memory_holes?: number;
  range_check_builtin_applications?: number;
  pedersen_builtin_applications?: number;
  poseidon_builtin_applications?: number;
  ec_op_builtin_applications?: number;
  ecdsa_builtin_applications?: number;
  bitwise_builtin_applications?: number;
  keccak_builtin_applications?: number;
  segment_arena_builtin?: number;
}

/**
 * Inner call execution resources
 */
export interface InnerCallExecutionResources {
  l1_gas: number;
  l2_gas: number;
}

/**
 * Function invocation
 */
export interface FunctionInvocation {
  contract_address: string;
  entry_point_selector: string;
  calldata: string[];
  caller_address: string;
  class_hash: string;
  entry_point_type: EntryPointType;
  call_type: CallType;
  result: string[];
  calls: FunctionInvocation[];
  events: OrderedEvent[];
  messages: OrderedMessage[];
  execution_resources: InnerCallExecutionResources;
}

/**
 * Revertible function invocation (may have revert_reason instead)
 */
export type RevertibleFunctionInvocation =
  | FunctionInvocation
  | { revert_reason: string };

/**
 * Invoke transaction trace
 */
export interface InvokeTxnTrace {
  type: 'INVOKE';
  validate_invocation?: FunctionInvocation;
  execute_invocation: RevertibleFunctionInvocation;
  fee_transfer_invocation?: FunctionInvocation;
  state_diff?: StateDiff;
  execution_resources: ComputationResources;
}

/**
 * Declare transaction trace
 */
export interface DeclareTxnTrace {
  type: 'DECLARE';
  validate_invocation?: FunctionInvocation;
  fee_transfer_invocation?: FunctionInvocation;
  state_diff?: StateDiff;
  execution_resources: ComputationResources;
}

/**
 * Deploy account transaction trace
 */
export interface DeployAccountTxnTrace {
  type: 'DEPLOY_ACCOUNT';
  validate_invocation?: FunctionInvocation;
  constructor_invocation: FunctionInvocation;
  fee_transfer_invocation?: FunctionInvocation;
  state_diff?: StateDiff;
  execution_resources: ComputationResources;
}

/**
 * L1 handler transaction trace
 */
export interface L1HandlerTxnTrace {
  type: 'L1_HANDLER';
  function_invocation: RevertibleFunctionInvocation;
  state_diff?: StateDiff;
  execution_resources: ComputationResources;
}

/**
 * Transaction trace union type
 */
export type TransactionTrace =
  | InvokeTxnTrace
  | DeclareTxnTrace
  | DeployAccountTxnTrace
  | L1HandlerTxnTrace;

/**
 * Block transaction trace
 */
export interface BlockTransactionTrace {
  transaction_hash: string;
  trace_root: TransactionTrace;
}

/**
 * Simulated transaction result
 */
export interface SimulatedTransaction {
  transaction_trace: TransactionTrace;
  fee_estimation: FeeEstimate;
}

// ============================================================================
// Broadcasted Transaction Types (for write API)
// ============================================================================

/**
 * Broadcasted invoke transaction
 */
export type BroadcastedInvokeTxn =
  | (Omit<InvokeTxnV1, 'type'> & { type: 'INVOKE' })
  | (Omit<InvokeTxnV3, 'type'> & { type: 'INVOKE' });

/**
 * Broadcasted declare transaction V2
 */
export interface BroadcastedDeclareTxnV2
  extends Omit<DeclareTxnV2, 'type' | 'class_hash'> {
  type: 'DECLARE';
  contract_class: ContractClass;
}

/**
 * Broadcasted declare transaction V3
 */
export interface BroadcastedDeclareTxnV3
  extends Omit<DeclareTxnV3, 'type' | 'class_hash'> {
  type: 'DECLARE';
  contract_class: ContractClass;
}

/**
 * Broadcasted declare transaction
 */
export type BroadcastedDeclareTxn =
  | BroadcastedDeclareTxnV2
  | BroadcastedDeclareTxnV3;

/**
 * Broadcasted deploy account transaction
 */
export type BroadcastedDeployAccountTxn = Omit<
  DeployAccountTxnV1 | DeployAccountTxnV3,
  'type'
> & {
  type: 'DEPLOY_ACCOUNT';
};

/**
 * Broadcasted transaction (any type)
 */
export type BroadcastedTxn =
  | BroadcastedInvokeTxn
  | BroadcastedDeclareTxn
  | BroadcastedDeployAccountTxn;

// ============================================================================
// Write API Results
// ============================================================================

/**
 * Result of add invoke transaction
 */
export interface AddInvokeTransactionResult {
  transaction_hash: string;
}

/**
 * Result of add declare transaction
 */
export interface AddDeclareTransactionResult {
  transaction_hash: string;
  class_hash: string;
}

/**
 * Result of add deploy account transaction
 */
export interface AddDeployAccountTransactionResult {
  transaction_hash: string;
  contract_address: string;
}

// ============================================================================
// Transaction Status Types
// ============================================================================

/**
 * Transaction status (from getTransactionStatus)
 */
export interface TransactionStatus {
  finality_status: 'RECEIVED' | 'ACCEPTED_ON_L2' | 'ACCEPTED_ON_L1';
  execution_status?: TxnExecutionStatus;
  failure_reason?: string;
}

// ============================================================================
// WebSocket Notification Payload Types
// ============================================================================

/**
 * Union of all possible WebSocket subscription notification payloads
 */
export type WsNotificationPayload =
  | NewHead
  | EmittedEvent
  | TransactionStatusUpdate
  | PendingTransaction
  | WsTransactionReceipt
  | ReorgData;
