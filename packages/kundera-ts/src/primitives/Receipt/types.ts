import type { Felt252Type } from "../Felt252/types.js";
import type { ContractAddressType } from "../ContractAddress/types.js";
import type { EventType } from "../Event/types.js";
import type {
	TxnFinalityStatus,
	TxnExecutionStatus,
} from "../../jsonrpc/types.js";

export interface FeePaymentType {
	amount: Felt252Type;
	unit: "WEI" | "FRI";
}

export interface MsgToL1Type {
	from_address: ContractAddressType;
	to_address: Felt252Type;
	payload: Felt252Type[];
}

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

export interface TxnReceiptCommonType {
	transaction_hash: Felt252Type;
	actual_fee: FeePaymentType;
	finality_status: TxnFinalityStatus;
	messages_sent: MsgToL1Type[];
	events: EventType[];
	execution_resources: ExecutionResourcesType;
	execution_status: TxnExecutionStatus;
	revert_reason?: string;
}

export interface InvokeTxnReceiptType extends TxnReceiptCommonType {
	type: "INVOKE";
}

export interface L1HandlerTxnReceiptType extends TxnReceiptCommonType {
	type: "L1_HANDLER";
	message_hash: string;
}

export interface DeclareTxnReceiptType extends TxnReceiptCommonType {
	type: "DECLARE";
}

export interface DeployAccountTxnReceiptType extends TxnReceiptCommonType {
	type: "DEPLOY_ACCOUNT";
	contract_address: ContractAddressType;
}

export type TxnReceiptType =
	| InvokeTxnReceiptType
	| L1HandlerTxnReceiptType
	| DeclareTxnReceiptType
	| DeployAccountTxnReceiptType;

export type TxnReceiptWithBlockInfoType = TxnReceiptType & {
	block_hash?: Felt252Type;
	block_number?: number;
};
