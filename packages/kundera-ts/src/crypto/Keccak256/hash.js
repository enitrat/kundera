import { keccak_256 } from "@noble/hashes/sha3.js";

/**
 * Keccak256 hash (pure JS)
 * @param {Uint8Array | string} data - Input data to hash
 * @returns {import('./types.js').Keccak256Hash} 32-byte hash
 */
export function hash(data) {
	const bytes =
		typeof data === "string" ? new TextEncoder().encode(data) : data;
	return /** @type {any} */ (keccak_256(bytes));
}

/**
 * Keccak256 hash returning hex string
 * @param {Uint8Array | string} data - Input data to hash
 * @returns {string} Hex string with 0x prefix
 */
export function hashHex(data) {
	const h = hash(data);
	return `0x${Array.from(h)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}
