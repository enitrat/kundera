import { type Felt252Type, Felt252 } from "../primitives/index.js";

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
