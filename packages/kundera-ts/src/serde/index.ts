/**
 * Starknet Serde - Cairo Serialization
 *
 * Cairo-compatible serialization for Starknet types.
 */

import { Felt252, type Felt252Type } from "../primitives/index.js";

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

/**
 * Deserialize two felts [low, high] to u256
 */
export function deserializeU256(felts: [Felt252Type, Felt252Type]): bigint {
	const low = felts[0].toBigInt();
	const high = felts[1].toBigInt();
	return (high << 128n) | low;
}

/**
 * Serialize an array of felts (prepends length)
 */
export function serializeArray(felts: Felt252Type[]): Felt252Type[] {
	return [Felt252(felts.length), ...felts];
}

/**
 * Deserialize an array of felts (reads length prefix)
 */
export function deserializeArray(
	felts: Felt252Type[],
	offset = 0,
): { array: Felt252Type[]; nextOffset: number } {
	const lengthFelt = felts[offset];
	if (!lengthFelt) {
		throw new Error(`Invalid offset ${offset}: array is empty or too short`);
	}
	const length = Number(lengthFelt.toBigInt());
	const array = felts.slice(offset + 1, offset + 1 + length);
	return { array, nextOffset: offset + 1 + length };
}

/**
 * Serialize a ByteArray
 *
 * Cairo ByteArray format:
 * [num_full_words, ...31-byte_chunks, pending_word, pending_word_len]
 */
export function serializeByteArray(data: Uint8Array): Felt252Type[] {
	const result: Felt252Type[] = [];

	// Split into 31-byte chunks
	const numFullWords = Math.floor(data.length / 31);
	result.push(Felt252(numFullWords));

	// Full 31-byte words
	for (let i = 0; i < numFullWords; i++) {
		const chunk = data.slice(i * 31, (i + 1) * 31);
		const padded = new Uint8Array(32);
		padded.set(chunk, 32 - chunk.length);
		result.push(Felt252.fromBytes(padded));
	}

	// Pending word (remaining bytes)
	const remaining = data.length % 31;
	if (remaining > 0) {
		const chunk = data.slice(numFullWords * 31);
		const padded = new Uint8Array(32);
		padded.set(chunk, 32 - chunk.length);
		result.push(Felt252.fromBytes(padded));
	} else {
		result.push(Felt252(0n));
	}

	// Pending word length
	result.push(Felt252(remaining));

	return result;
}

// ============ Namespace exports ============

export const CairoSerde = {
	serializeU256,
	deserializeU256,
	serializeArray,
	deserializeArray,
	serializeByteArray,
} as const;
