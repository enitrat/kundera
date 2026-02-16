import type { Felt252Type } from "../primitives/index.js";

/**
 * Deserialize two felts [low, high] to u256
 */
export function deserializeU256(felts: [Felt252Type, Felt252Type]): bigint {
	const low = felts[0].toBigInt();
	const high = felts[1].toBigInt();
	return (high << 128n) | low;
}
