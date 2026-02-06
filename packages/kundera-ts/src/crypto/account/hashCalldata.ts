/**
 * Hash Calldata
 *
 * Hash calldata array using Poseidon.
 */

import { Felt252, type Felt252Type } from "../../primitives/index.js";
import { poseidonHashMany } from "../hash.js";
import { POSEIDON_EMPTY_ARRAY_HASH } from "./constants.js";

/**
 * Hash calldata array using Poseidon
 * Note: Empty arrays still go through poseidon (matching starknet.js behavior)
 */
export function hashCalldata(calldata: bigint[]): Felt252Type {
	if (calldata.length === 0) {
		// Return precomputed hash for empty array (FFI doesn't support empty arrays)
		return POSEIDON_EMPTY_ARRAY_HASH;
	}
	return poseidonHashMany(calldata.map((c) => Felt252(c)));
}
