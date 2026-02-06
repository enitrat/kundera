import { pedersen } from "@scure/starknet";
import { Felt252 } from "../../primitives/Felt252/index.js";

/**
 * Pedersen hash of two felts (pure JS)
 * @param {import('../../primitives/Felt252/types.js').Felt252Type} a
 * @param {import('../../primitives/Felt252/types.js').Felt252Type} b
 * @returns {import('./types.js').PedersenHash}
 */
export function hash(a, b) {
	const result = pedersen(a.toBigInt(), b.toBigInt());
	return Felt252(result);
}

/**
 * Pedersen hash of array (chained)
 * @param {import('../../primitives/Felt252/types.js').Felt252Type[]} values
 * @returns {import('./types.js').PedersenHash}
 */
export function hashMany(values) {
	if (values.length === 0) {
		return Felt252(0n);
	}
	/** @type {import('./types.js').PedersenHash} */
	let result =
		/** @type {import('../../primitives/Felt252/types.js').Felt252Type} */ (
			values[0]
		);
	for (let i = 1; i < values.length; i++) {
		result = hash(
			result,
			/** @type {import('../../primitives/Felt252/types.js').Felt252Type} */ (
				values[i]
			),
		);
	}
	return result;
}
