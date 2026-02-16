import type { CallType, EntryPointType } from "../../jsonrpc/types.js";
import type { ClassHashType } from "../ClassHash/types.js";
import type { ContractAddressType } from "../ContractAddress/types.js";
import type { FeeEstimateType } from "../FeeEstimate/types.js";
import type { Felt252Type } from "../Felt252/types.js";
import type { StateDiffType } from "../StateUpdate/types.js";

export interface ExecutionResourcesType {
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

export interface InnerCallExecutionResourcesType {
	l1_gas: number;
	l2_gas: number;
}

export interface OrderedEventType {
	order: number;
	keys: Felt252Type[];
	data: Felt252Type[];
}

export interface OrderedMessageType {
	order: number;
	to_address: Felt252Type;
	payload: Felt252Type[];
}

export interface FunctionInvocationType {
	contract_address: ContractAddressType;
	entry_point_selector: Felt252Type;
	calldata: Felt252Type[];
	caller_address: ContractAddressType;
	class_hash: ClassHashType;
	entry_point_type: EntryPointType;
	call_type: CallType;
	result: Felt252Type[];
	calls: FunctionInvocationType[];
	events: OrderedEventType[];
	messages: OrderedMessageType[];
	execution_resources: InnerCallExecutionResourcesType;
}

export type RevertibleFunctionInvocationType =
	| FunctionInvocationType
	| { revert_reason: string };

export interface InvokeTxnTraceType {
	type: "INVOKE";
	validate_invocation?: FunctionInvocationType;
	execute_invocation: RevertibleFunctionInvocationType;
	fee_transfer_invocation?: FunctionInvocationType;
	state_diff?: StateDiffType;
	execution_resources: ExecutionResourcesType;
}

export interface DeclareTxnTraceType {
	type: "DECLARE";
	validate_invocation?: FunctionInvocationType;
	fee_transfer_invocation?: FunctionInvocationType;
	state_diff?: StateDiffType;
	execution_resources: ExecutionResourcesType;
}

export interface DeployAccountTxnTraceType {
	type: "DEPLOY_ACCOUNT";
	validate_invocation?: FunctionInvocationType;
	constructor_invocation: FunctionInvocationType;
	fee_transfer_invocation?: FunctionInvocationType;
	state_diff?: StateDiffType;
	execution_resources: ExecutionResourcesType;
}

export interface L1HandlerTxnTraceType {
	type: "L1_HANDLER";
	function_invocation: RevertibleFunctionInvocationType;
	state_diff?: StateDiffType;
	execution_resources: ExecutionResourcesType;
}

export type TransactionTraceType =
	| InvokeTxnTraceType
	| DeclareTxnTraceType
	| DeployAccountTxnTraceType
	| L1HandlerTxnTraceType;

export interface BlockTransactionTraceType {
	transaction_hash: Felt252Type;
	trace_root: TransactionTraceType;
}

export interface SimulatedTransactionType {
	transaction_trace: TransactionTraceType;
	fee_estimation: FeeEstimateType;
}
