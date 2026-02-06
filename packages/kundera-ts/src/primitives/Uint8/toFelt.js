import { Felt252 } from "../Felt252/index.js";

/**
 * Convert Uint8 to Felt252
 *
 * @param {import('./types.js').Uint8Type} uint - Uint8 value
 * @returns {import('../Felt252/types.js').Felt252Type} Felt252 value
 */
export function toFelt(uint) {
	return Felt252.fromBigInt(uint);
}
