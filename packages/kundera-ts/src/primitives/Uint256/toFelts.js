import { Felt252 } from "../Felt252/index.js";
import { LOW_MASK } from "./constants.js";

/**
 * Convert Uint256 to two Felt252 values [low, high]
 *
 * CRITICAL: In Cairo, u256 is a struct with two u128 fields:
 *   struct u256 { low: u128, high: u128 }
 *
 * Serialization format: [low, high]
 * value = low + high * 2^128
 *
 * @param {import('./types.js').Uint256Type} uint - Uint256 value
 * @returns {[import('../Felt252/types.js').Felt252Type, import('../Felt252/types.js').Felt252Type]} Tuple of [low, high] Felt252 values
 */
export function toFelts(uint) {
	const value = /** @type {bigint} */ (uint);
	const low = value & LOW_MASK;
	const high = value >> 128n;

	return [Felt252.fromBigInt(low), Felt252.fromBigInt(high)];
}
