import type { ContractAddressType } from "../ContractAddress/types.js";
import type { Felt252Type } from "../Felt252/types.js";

export interface ResourcePriceType {
	price_in_fri: Felt252Type;
	price_in_wei: Felt252Type;
}

export interface BlockHeaderType {
	block_hash: Felt252Type;
	parent_hash: Felt252Type;
	block_number: number;
	new_root: Felt252Type;
	timestamp: number;
	sequencer_address: ContractAddressType;
	l1_gas_price: ResourcePriceType;
	l2_gas_price: ResourcePriceType;
	l1_data_gas_price: ResourcePriceType;
	l1_da_mode: "BLOB" | "CALLDATA";
	starknet_version: string;
}

export interface BlockHeaderWithCommitmentsType extends BlockHeaderType {
	event_commitment: Felt252Type;
	transaction_commitment: Felt252Type;
	receipt_commitment: Felt252Type;
	state_diff_commitment: Felt252Type;
	event_count: number;
	transaction_count: number;
	state_diff_length: number;
}
