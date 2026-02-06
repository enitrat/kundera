/**
 * Rich RPC Types
 *
 * Branded-type equivalents of wire-format RPC types.
 * Wire hex strings are replaced with kundera primitives.
 *
 * @module rpc/rich
 */

import type { Felt252Type } from '../primitives/Felt252/types.js';
import type { ContractAddressType } from '../primitives/ContractAddress/types.js';
import type { ClassHashType } from '../primitives/ClassHash/types.js';
import type {
  BlockStatus,
  DAMode,
  CallType,
  EntryPointType,
  TxnFinalityStatus,
  TxnExecutionStatus,
} from './types.js';

// ============================================================================
// Shared
// ============================================================================

export interface RichResourcePrice {
  price_in_fri: Felt252Type;
  price_in_wei: Felt252Type;
}

export interface RichResourceBounds {
  max_amount: Felt252Type;
  max_price_per_unit: Felt252Type;
}

export interface RichResourceBoundsMapping {
  l1_gas: RichResourceBounds;
  l2_gas: RichResourceBounds;
}

export interface RichFeePayment {
  amount: Felt252Type;
  unit: 'WEI' | 'FRI';
}

// ============================================================================
// Block Types
// ============================================================================

export interface RichBlockHeader {
  block_hash: Felt252Type;
  parent_hash: Felt252Type;
  block_number: number;
  new_root: Felt252Type;
  timestamp: number;
  sequencer_address: ContractAddressType;
  l1_gas_price: RichResourcePrice;
  l2_gas_price: RichResourcePrice;
  l1_data_gas_price: RichResourcePrice;
  l1_da_mode: 'BLOB' | 'CALLDATA';
  starknet_version: string;
}

export interface RichBlockHeaderWithCommitments extends RichBlockHeader {
  event_commitment: Felt252Type;
  transaction_commitment: Felt252Type;
  receipt_commitment: Felt252Type;
  state_diff_commitment: Felt252Type;
  event_count: number;
  transaction_count: number;
  state_diff_length: number;
}

export interface RichBlockWithTxHashes extends RichBlockHeaderWithCommitments {
  status: BlockStatus;
  transactions: Felt252Type[];
}

export interface RichBlockWithTxs extends RichBlockHeaderWithCommitments {
  status: BlockStatus;
  transactions: RichTxnWithHash[];
}

export interface RichTxnWithReceipt {
  transaction: RichTxn;
  receipt: RichTxnReceipt;
}

export interface RichBlockWithReceipts extends RichBlockHeaderWithCommitments {
  status: BlockStatus;
  transactions: RichTxnWithReceipt[];
}

// ============================================================================
// Transaction Types
// ============================================================================

export interface RichInvokeTxnV0 {
  type: 'INVOKE';
  version: '0x0' | '0x100000000000000000000000000000000';
  max_fee: Felt252Type;
  signature: Felt252Type[];
  contract_address: ContractAddressType;
  entry_point_selector: Felt252Type;
  calldata: Felt252Type[];
}

export interface RichInvokeTxnV1 {
  type: 'INVOKE';
  version: '0x1' | '0x100000000000000000000000000000001';
  sender_address: ContractAddressType;
  calldata: Felt252Type[];
  max_fee: Felt252Type;
  signature: Felt252Type[];
  nonce: Felt252Type;
}

export interface RichInvokeTxnV3 {
  type: 'INVOKE';
  version: '0x3' | '0x100000000000000000000000000000003';
  sender_address: ContractAddressType;
  calldata: Felt252Type[];
  signature: Felt252Type[];
  nonce: Felt252Type;
  resource_bounds: RichResourceBoundsMapping;
  tip: Felt252Type;
  paymaster_data: Felt252Type[];
  account_deployment_data: Felt252Type[];
  nonce_data_availability_mode: DAMode;
  fee_data_availability_mode: DAMode;
}

export type RichInvokeTxn = RichInvokeTxnV0 | RichInvokeTxnV1 | RichInvokeTxnV3;

export interface RichL1HandlerTxn {
  type: 'L1_HANDLER';
  version: '0x0';
  nonce: Felt252Type;
  contract_address: ContractAddressType;
  entry_point_selector: Felt252Type;
  calldata: Felt252Type[];
}

export interface RichDeclareTxnV0 {
  type: 'DECLARE';
  version: '0x0' | '0x100000000000000000000000000000000';
  sender_address: ContractAddressType;
  max_fee: Felt252Type;
  signature: Felt252Type[];
  class_hash: ClassHashType;
}

export interface RichDeclareTxnV1 {
  type: 'DECLARE';
  version: '0x1' | '0x100000000000000000000000000000001';
  sender_address: ContractAddressType;
  max_fee: Felt252Type;
  signature: Felt252Type[];
  nonce: Felt252Type;
  class_hash: ClassHashType;
}

export interface RichDeclareTxnV2 {
  type: 'DECLARE';
  version: '0x2' | '0x100000000000000000000000000000002';
  sender_address: ContractAddressType;
  compiled_class_hash: ClassHashType;
  max_fee: Felt252Type;
  signature: Felt252Type[];
  nonce: Felt252Type;
  class_hash: ClassHashType;
}

export interface RichDeclareTxnV3 {
  type: 'DECLARE';
  version: '0x3' | '0x100000000000000000000000000000003';
  sender_address: ContractAddressType;
  compiled_class_hash: ClassHashType;
  signature: Felt252Type[];
  nonce: Felt252Type;
  class_hash: ClassHashType;
  resource_bounds: RichResourceBoundsMapping;
  tip: Felt252Type;
  paymaster_data: Felt252Type[];
  account_deployment_data: Felt252Type[];
  nonce_data_availability_mode: DAMode;
  fee_data_availability_mode: DAMode;
}

export type RichDeclareTxn =
  | RichDeclareTxnV0
  | RichDeclareTxnV1
  | RichDeclareTxnV2
  | RichDeclareTxnV3;

export interface RichDeployAccountTxnV1 {
  type: 'DEPLOY_ACCOUNT';
  version: '0x1' | '0x100000000000000000000000000000001';
  max_fee: Felt252Type;
  signature: Felt252Type[];
  nonce: Felt252Type;
  contract_address_salt: Felt252Type;
  constructor_calldata: Felt252Type[];
  class_hash: ClassHashType;
}

export interface RichDeployAccountTxnV3 {
  type: 'DEPLOY_ACCOUNT';
  version: '0x3' | '0x100000000000000000000000000000003';
  signature: Felt252Type[];
  nonce: Felt252Type;
  contract_address_salt: Felt252Type;
  constructor_calldata: Felt252Type[];
  class_hash: ClassHashType;
  resource_bounds: RichResourceBoundsMapping;
  tip: Felt252Type;
  paymaster_data: Felt252Type[];
  nonce_data_availability_mode: DAMode;
  fee_data_availability_mode: DAMode;
}

export type RichDeployAccountTxn = RichDeployAccountTxnV1 | RichDeployAccountTxnV3;

export type RichTxn =
  | RichInvokeTxn
  | RichL1HandlerTxn
  | RichDeclareTxn
  | RichDeployAccountTxn;

export type RichTxnWithHash = RichTxn & { transaction_hash: Felt252Type };

// ============================================================================
// Receipt Types
// ============================================================================

export interface RichEvent {
  from_address: ContractAddressType;
  keys: Felt252Type[];
  data: Felt252Type[];
}

export interface RichMsgToL1 {
  from_address: ContractAddressType;
  to_address: Felt252Type;
  payload: Felt252Type[];
}

export interface RichExecutionResources {
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

export interface RichTxnReceiptCommon {
  transaction_hash: Felt252Type;
  actual_fee: RichFeePayment;
  finality_status: TxnFinalityStatus;
  messages_sent: RichMsgToL1[];
  events: RichEvent[];
  execution_resources: RichExecutionResources;
  execution_status: TxnExecutionStatus;
  revert_reason?: string;
}

export interface RichInvokeTxnReceipt extends RichTxnReceiptCommon {
  type: 'INVOKE';
}

export interface RichL1HandlerTxnReceipt extends RichTxnReceiptCommon {
  type: 'L1_HANDLER';
  message_hash: string;
}

export interface RichDeclareTxnReceipt extends RichTxnReceiptCommon {
  type: 'DECLARE';
}

export interface RichDeployAccountTxnReceipt extends RichTxnReceiptCommon {
  type: 'DEPLOY_ACCOUNT';
  contract_address: ContractAddressType;
}

export type RichTxnReceipt =
  | RichInvokeTxnReceipt
  | RichL1HandlerTxnReceipt
  | RichDeclareTxnReceipt
  | RichDeployAccountTxnReceipt;

export type RichTxnReceiptWithBlockInfo = RichTxnReceipt & {
  block_hash?: Felt252Type;
  block_number?: number;
};

// ============================================================================
// Event Types
// ============================================================================

export interface RichEmittedEvent extends RichEvent {
  block_hash: Felt252Type;
  block_number: number;
  transaction_hash: Felt252Type;
}

export interface RichEventsResponse {
  events: RichEmittedEvent[];
  continuation_token?: string;
}

// ============================================================================
// State Update Types
// ============================================================================

export interface RichContractStorageDiffItem {
  address: ContractAddressType;
  storage_entries: { key: Felt252Type; value: Felt252Type }[];
}

export interface RichDeployedContractItem {
  address: ContractAddressType;
  class_hash: ClassHashType;
}

export interface RichDeclaredClassItem {
  class_hash: ClassHashType;
  compiled_class_hash: ClassHashType;
}

export interface RichReplacedClassItem {
  contract_address: ContractAddressType;
  class_hash: ClassHashType;
}

export interface RichNonceUpdateItem {
  contract_address: ContractAddressType;
  nonce: Felt252Type;
}

export interface RichStateDiff {
  storage_diffs: RichContractStorageDiffItem[];
  declared_classes: RichDeclaredClassItem[];
  deployed_contracts: RichDeployedContractItem[];
  replaced_classes: RichReplacedClassItem[];
  nonces: RichNonceUpdateItem[];
}

export interface RichStateUpdate {
  block_hash: Felt252Type;
  old_root: Felt252Type;
  new_root: Felt252Type;
  state_diff: RichStateDiff;
}

// ============================================================================
// Fee Estimate Types
// ============================================================================

export interface RichFeeEstimate {
  gas_consumed: Felt252Type;
  gas_price: Felt252Type;
  data_gas_consumed: Felt252Type;
  data_gas_price: Felt252Type;
  overall_fee: Felt252Type;
  unit: 'WEI' | 'FRI';
}

// ============================================================================
// Trace Types
// ============================================================================

export interface RichOrderedEvent {
  order: number;
  keys: Felt252Type[];
  data: Felt252Type[];
}

export interface RichOrderedMessage {
  order: number;
  to_address: Felt252Type;
  payload: Felt252Type[];
}

export interface RichInnerCallExecutionResources {
  l1_gas: number;
  l2_gas: number;
}

export interface RichFunctionInvocation {
  contract_address: ContractAddressType;
  entry_point_selector: Felt252Type;
  calldata: Felt252Type[];
  caller_address: ContractAddressType;
  class_hash: ClassHashType;
  entry_point_type: EntryPointType;
  call_type: CallType;
  result: Felt252Type[];
  calls: RichFunctionInvocation[];
  events: RichOrderedEvent[];
  messages: RichOrderedMessage[];
  execution_resources: RichInnerCallExecutionResources;
}

export type RichRevertibleFunctionInvocation =
  | RichFunctionInvocation
  | { revert_reason: string };

export interface RichInvokeTxnTrace {
  type: 'INVOKE';
  validate_invocation?: RichFunctionInvocation;
  execute_invocation: RichRevertibleFunctionInvocation;
  fee_transfer_invocation?: RichFunctionInvocation;
  state_diff?: RichStateDiff;
  execution_resources: RichExecutionResources;
}

export interface RichDeclareTxnTrace {
  type: 'DECLARE';
  validate_invocation?: RichFunctionInvocation;
  fee_transfer_invocation?: RichFunctionInvocation;
  state_diff?: RichStateDiff;
  execution_resources: RichExecutionResources;
}

export interface RichDeployAccountTxnTrace {
  type: 'DEPLOY_ACCOUNT';
  validate_invocation?: RichFunctionInvocation;
  constructor_invocation: RichFunctionInvocation;
  fee_transfer_invocation?: RichFunctionInvocation;
  state_diff?: RichStateDiff;
  execution_resources: RichExecutionResources;
}

export interface RichL1HandlerTxnTrace {
  type: 'L1_HANDLER';
  function_invocation: RichRevertibleFunctionInvocation;
  state_diff?: RichStateDiff;
  execution_resources: RichExecutionResources;
}

export type RichTransactionTrace =
  | RichInvokeTxnTrace
  | RichDeclareTxnTrace
  | RichDeployAccountTxnTrace
  | RichL1HandlerTxnTrace;

export interface RichBlockTransactionTrace {
  transaction_hash: Felt252Type;
  trace_root: RichTransactionTrace;
}

export interface RichSimulatedTransaction {
  transaction_trace: RichTransactionTrace;
  fee_estimation: RichFeeEstimate;
}
