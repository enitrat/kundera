import { Felt252 } from "../Felt252/index.js";
import { MAX, PRIME } from "./constants.js";
import { from } from "./from.js";

/**
 * Decode a Felt252 back to an Int8.
 *
 * CRITICAL: This reverses Cairo's field encoding.
 *
 * Cairo encodes negative values as PRIME + negative_value.
 * To decode:
 * - If value `<=` MAX, it's positive (or zero)
 * - If value `>` MAX, it's a negative number: actual = value - PRIME
 *
 * @param {import('../Felt252/index.js').Felt252Type} felt - The Felt252 to decode
 * @returns {import('./types.js').Int8Type} The signed Int8 value
 * @throws {import('./errors.js').Int8RangeError} if the decoded value is outside Int8 range
 */
export function fromFelt(felt) {
	const value = Felt252.toBigInt(felt);

	// If value is within positive Int8 range, return as-is
	if (value <= MAX) {
		return from(value);
	}

	// Value > MAX means it's a negative number encoded as PRIME + negative
	// Decode by subtracting PRIME
	return from(value - PRIME);
}
