import { type Felt252Type } from "../primitives/index.js";

/**
 * Deserialize an array of felts (reads length prefix)
 */
export function deserializeArray(
	felts: Felt252Type[],
	offset: number = 0,
): { array: Felt252Type[]; nextOffset: number } {
	const lengthFelt = felts[offset];
	if (!lengthFelt) {
		throw new Error(`Invalid offset ${offset}: array is empty or too short`);
	}
	const length = Number(lengthFelt.toBigInt());
	const array = felts.slice(offset + 1, offset + 1 + length);
	return { array, nextOffset: offset + 1 + length };
}
