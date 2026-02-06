/**
 * Kanabi Type Configuration
 *
 * Module augmentation to customize abi-wan-kanabi's type mappings.
 * Maps Cairo types to Kundera's branded primitive types.
 *
 * Supported keys (from kanabi's ResolvedConfig):
 * - FeltType: felt252
 * - AddressType: ContractAddress, EthAddress
 * - ClassHashType: ClassHash
 * - IntType: u8, u16, u32
 * - BigIntType: u64, u128
 * - U256Type: u256
 *
 * @see https://github.com/keep-starknet-strange/abi-wan-kanabi
 */
import type { Felt252Type } from "../primitives/Felt252/types.js";
import type { ContractAddressType } from "../primitives/ContractAddress/types.js";
import type { ClassHashType } from "../primitives/ClassHash/types.js";
import type { Uint256Type } from "../primitives/Uint256/types.js";

declare module "abi-wan-kanabi" {
	export interface Config<OptionT = any, ResultT = any, ErrorT = any> {
		/** Maps felt252 → Felt252Type */
		FeltType: Felt252Type;
		/** Maps ContractAddress, EthAddress → ContractAddressType */
		AddressType: ContractAddressType;
		/** Maps ClassHash → ClassHashType */
		ClassHashType: ClassHashType;
		/** Maps u8, u16, u32 → number (kanabi default) */
		IntType: number;
		/** Maps u64, u128 → bigint */
		BigIntType: bigint;
		/** Maps u256 → Uint256Type */
		U256Type: Uint256Type;
	}
}

declare module "abi-wan-kanabi/dist/config" {
	export interface Config<OptionT = any, ResultT = any, ErrorT = any> {
		FeltType: Felt252Type;
		AddressType: ContractAddressType;
		ClassHashType: ClassHashType;
		IntType: number;
		BigIntType: bigint;
		U256Type: Uint256Type;
	}
}

declare module "abi-wan-kanabi/config" {
	export interface Config<OptionT = any, ResultT = any, ErrorT = any> {
		FeltType: Felt252Type;
		AddressType: ContractAddressType;
		ClassHashType: ClassHashType;
		IntType: number;
		BigIntType: bigint;
		U256Type: Uint256Type;
	}
}

export {};
