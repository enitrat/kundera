import { Felt252, type Felt252Type } from "../primitives/index.js";

/**
 * Serialize an array of felts (prepends length)
 */
export function serializeArray(felts: Felt252Type[]): Felt252Type[] {
	return [Felt252(felts.length), ...felts];
}
