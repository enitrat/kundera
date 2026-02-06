import { Felt252 } from "../Felt252/index.js";

/**
 * Convert Uint16 to Felt252
 *
 * @param {import('./types.js').Uint16Type} uint - Uint16 value
 * @returns {import('../Felt252/types.js').Felt252Type} Felt252 value
 */
export function toFelt(uint) {
	return Felt252.fromBigInt(uint);
}
