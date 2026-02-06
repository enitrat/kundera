import { PRIME } from "./constants.js";
import { Felt252 } from "../Felt252/index.js";

/**
 * Convert an Int8 to a Felt252 using Cairo field encoding.
 *
 * CRITICAL: Cairo signed integer encoding is NOT two's complement!
 *
 * Cairo uses prime field arithmetic:
 * - Positive values: stored directly (0 to MAX)
 * - Negative values: stored as PRIME + negative_value
 *
 * This is because in modular arithmetic over the field,
 * PRIME + x === x (mod PRIME), so PRIME - 1 represents -1.
 *
 * @param {import('./types.js').Int8Type} value - The Int8 to convert
 * @returns {import('../Felt252/index.js').Felt252Type} The Felt252 representation for Cairo
 */
export function toFelt(value) {
	const bigintValue = /** @type {bigint} */ (value);

	if (bigintValue >= 0n) {
		return Felt252.fromBigInt(bigintValue);
	}

	// Negative: encode as PRIME + value
	// e.g., -1 becomes PRIME - 1
	return Felt252.fromBigInt(PRIME + bigintValue);
}
