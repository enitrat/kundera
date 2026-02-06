import type { Felt252Type } from "../Felt252/types.js";
import type { ContractAddressType } from "../ContractAddress/types.js";
import type { ClassHashType } from "../ClassHash/types.js";

export interface ContractStorageDiffItemType {
	address: ContractAddressType;
	storage_entries: { key: Felt252Type; value: Felt252Type }[];
}

export interface DeployedContractItemType {
	address: ContractAddressType;
	class_hash: ClassHashType;
}

export interface DeclaredClassItemType {
	class_hash: ClassHashType;
	compiled_class_hash: ClassHashType;
}

export interface ReplacedClassItemType {
	contract_address: ContractAddressType;
	class_hash: ClassHashType;
}

export interface NonceUpdateItemType {
	contract_address: ContractAddressType;
	nonce: Felt252Type;
}

export interface StateDiffType {
	storage_diffs: ContractStorageDiffItemType[];
	declared_classes: DeclaredClassItemType[];
	deployed_contracts: DeployedContractItemType[];
	replaced_classes: ReplacedClassItemType[];
	nonces: NonceUpdateItemType[];
}

export interface StateUpdateType {
	block_hash: Felt252Type;
	old_root: Felt252Type;
	new_root: Felt252Type;
	state_diff: StateDiffType;
}
