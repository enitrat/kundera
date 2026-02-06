import { type Felt252Type, Felt252 } from "../primitives/index.js";

/**
 * Serialize a u256 as two felts [low, high]
 *
 * Cairo represents u256 as two u128 limbs in little-endian order.
 */
export function serializeU256(value: bigint): [Felt252Type, Felt252Type] {
	const mask = (1n << 128n) - 1n;
	const low = value & mask;
	const high = value >> 128n;

	return [Felt252.fromBigInt(low), Felt252.fromBigInt(high)];
}
