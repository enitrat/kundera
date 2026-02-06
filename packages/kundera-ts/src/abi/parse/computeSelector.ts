/**
 * Selector Computation
 *
 * Compute function/event selectors from names.
 */

import { snKeccak } from "../../crypto/index.js";

/**
 * Compute function/event selector from name
 *
 * Selector = starknet_keccak(name) mod 2^250
 */
export function computeSelector(name: string): bigint {
	const hash = snKeccak(name);
	const value = hash.toBigInt();
	// Mask to 250 bits
	const mask = (1n << 250n) - 1n;
	return value & mask;
}

/**
 * Compute selector and return as hex
 */
export function computeSelectorHex(name: string): string {
	const selector = computeSelector(name);
	return "0x" + selector.toString(16);
}
