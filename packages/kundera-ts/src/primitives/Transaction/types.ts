import type { Felt252Type } from "../Felt252/types.js";
import type { ContractAddressType } from "../ContractAddress/types.js";
import type { ClassHashType } from "../ClassHash/types.js";
import type { DAMode } from "../../jsonrpc/types.js";

export interface ResourceBoundsType {
	max_amount: Felt252Type;
	max_price_per_unit: Felt252Type;
}

export interface ResourceBoundsMappingType {
	l1_gas: ResourceBoundsType;
	l2_gas: ResourceBoundsType;
}

export interface InvokeTxnV0Type {
	type: "INVOKE";
	version: "0x0" | "0x100000000000000000000000000000000";
	max_fee: Felt252Type;
	signature: Felt252Type[];
	contract_address: ContractAddressType;
	entry_point_selector: Felt252Type;
	calldata: Felt252Type[];
}

export interface InvokeTxnV1Type {
	type: "INVOKE";
	version: "0x1" | "0x100000000000000000000000000000001";
	sender_address: ContractAddressType;
	calldata: Felt252Type[];
	max_fee: Felt252Type;
	signature: Felt252Type[];
	nonce: Felt252Type;
}

export interface InvokeTxnV3Type {
	type: "INVOKE";
	version: "0x3" | "0x100000000000000000000000000000003";
	sender_address: ContractAddressType;
	calldata: Felt252Type[];
	signature: Felt252Type[];
	nonce: Felt252Type;
	resource_bounds: ResourceBoundsMappingType;
	tip: Felt252Type;
	paymaster_data: Felt252Type[];
	account_deployment_data: Felt252Type[];
	nonce_data_availability_mode: DAMode;
	fee_data_availability_mode: DAMode;
}

export type InvokeTxnType = InvokeTxnV0Type | InvokeTxnV1Type | InvokeTxnV3Type;

export interface L1HandlerTxnType {
	type: "L1_HANDLER";
	version: "0x0";
	nonce: Felt252Type;
	contract_address: ContractAddressType;
	entry_point_selector: Felt252Type;
	calldata: Felt252Type[];
}

export interface DeclareTxnV0Type {
	type: "DECLARE";
	version: "0x0" | "0x100000000000000000000000000000000";
	sender_address: ContractAddressType;
	max_fee: Felt252Type;
	signature: Felt252Type[];
	class_hash: ClassHashType;
}

export interface DeclareTxnV1Type {
	type: "DECLARE";
	version: "0x1" | "0x100000000000000000000000000000001";
	sender_address: ContractAddressType;
	max_fee: Felt252Type;
	signature: Felt252Type[];
	nonce: Felt252Type;
	class_hash: ClassHashType;
}

export interface DeclareTxnV2Type {
	type: "DECLARE";
	version: "0x2" | "0x100000000000000000000000000000002";
	sender_address: ContractAddressType;
	compiled_class_hash: ClassHashType;
	max_fee: Felt252Type;
	signature: Felt252Type[];
	nonce: Felt252Type;
	class_hash: ClassHashType;
}

export interface DeclareTxnV3Type {
	type: "DECLARE";
	version: "0x3" | "0x100000000000000000000000000000003";
	sender_address: ContractAddressType;
	compiled_class_hash: ClassHashType;
	signature: Felt252Type[];
	nonce: Felt252Type;
	class_hash: ClassHashType;
	resource_bounds: ResourceBoundsMappingType;
	tip: Felt252Type;
	paymaster_data: Felt252Type[];
	account_deployment_data: Felt252Type[];
	nonce_data_availability_mode: DAMode;
	fee_data_availability_mode: DAMode;
}

export type DeclareTxnType =
	| DeclareTxnV0Type
	| DeclareTxnV1Type
	| DeclareTxnV2Type
	| DeclareTxnV3Type;

export interface DeployAccountTxnV1Type {
	type: "DEPLOY_ACCOUNT";
	version: "0x1" | "0x100000000000000000000000000000001";
	max_fee: Felt252Type;
	signature: Felt252Type[];
	nonce: Felt252Type;
	contract_address_salt: Felt252Type;
	constructor_calldata: Felt252Type[];
	class_hash: ClassHashType;
}

export interface DeployAccountTxnV3Type {
	type: "DEPLOY_ACCOUNT";
	version: "0x3" | "0x100000000000000000000000000000003";
	signature: Felt252Type[];
	nonce: Felt252Type;
	contract_address_salt: Felt252Type;
	constructor_calldata: Felt252Type[];
	class_hash: ClassHashType;
	resource_bounds: ResourceBoundsMappingType;
	tip: Felt252Type;
	paymaster_data: Felt252Type[];
	nonce_data_availability_mode: DAMode;
	fee_data_availability_mode: DAMode;
}

export type DeployAccountTxnType =
	| DeployAccountTxnV1Type
	| DeployAccountTxnV3Type;

export type TxnType =
	| InvokeTxnType
	| L1HandlerTxnType
	| DeclareTxnType
	| DeployAccountTxnType;

export type TxnWithHashType = TxnType & { transaction_hash: Felt252Type };
