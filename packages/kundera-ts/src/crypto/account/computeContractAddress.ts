/**
 * Compute Contract Address
 *
 * Pedersen-based contract address computation for DEPLOY_ACCOUNT.
 */

import {
	Felt252,
	type Felt252Input,
	type Felt252Type,
} from "../../primitives/index.js";
import { pedersenHash } from "../hash.js";
import { CONTRACT_ADDRESS_PREFIX } from "./constants.js";

/**
 * Compute contract address for DEPLOY_ACCOUNT
 *
 * address = pedersen(
 *   "STARKNET_CONTRACT_ADDRESS",
 *   0, // deployer_address (0 for deploy_account)
 *   salt,
 *   class_hash,
 *   pedersen(constructor_calldata)
 * ) mod 2^251
 *
 * Note: Uses Pedersen, not Poseidon (per spec)
 */
export function computeContractAddress(
	classHash: Felt252Input,
	salt: Felt252Input,
	constructorCalldata: bigint[],
	deployerAddress: Felt252Input = 0n,
): Felt252Type {
	// Hash constructor calldata with Pedersen
	let calldataHash = Felt252(0n);
	for (const item of constructorCalldata) {
		calldataHash = pedersenHash(calldataHash, Felt252(item));
	}

	// Compute address
	let hash = pedersenHash(CONTRACT_ADDRESS_PREFIX, Felt252(deployerAddress));
	hash = pedersenHash(hash, Felt252(salt));
	hash = pedersenHash(hash, Felt252(classHash));
	hash = pedersenHash(hash, calldataHash);

	// Mod 2^251
	const hashBigInt = hash.toBigInt();
	const addressBigInt = hashBigInt & ((1n << 251n) - 1n);

	return Felt252(addressBigInt);
}
