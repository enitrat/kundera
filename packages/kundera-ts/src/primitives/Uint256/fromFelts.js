import { Felt252 } from "../Felt252/index.js";
import { from } from "./from.js";

/**
 * Create Uint256 from two Felt252 values [low, high]
 *
 * In Cairo, u256 is a struct: { low: u128, high: u128 }
 * value = low + high * 2^128
 *
 * @param {import('../Felt252/types.js').Felt252Type} low - Low 128 bits as Felt252
 * @param {import('../Felt252/types.js').Felt252Type} high - High 128 bits as Felt252
 * @returns {import('./types.js').Uint256Type} Uint256 value
 */
export function fromFelts(low, high) {
	const lowBigInt = Felt252.toBigInt(low);
	const highBigInt = Felt252.toBigInt(high);

	const value = lowBigInt + (highBigInt << 128n);
	return from(value);
}
