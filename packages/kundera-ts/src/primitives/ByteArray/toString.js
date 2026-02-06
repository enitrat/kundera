import { toBytes } from "./toBytes.js";

/**
 * Convert ByteArray to UTF-8 string
 *
 * @param {import('./types.js').ByteArrayType} byteArray
 * @returns {string}
 */
export function toString(byteArray) {
	const decoder = new TextDecoder();
	return decoder.decode(toBytes(byteArray));
}
