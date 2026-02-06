import { from } from "./from.js";

/**
 * Create ByteArray from UTF-8 string
 *
 * @param {string} str - Input string
 * @returns {import('./types.js').ByteArrayType}
 */
export function fromString(str) {
	const encoder = new TextEncoder();
	return from(encoder.encode(str));
}
