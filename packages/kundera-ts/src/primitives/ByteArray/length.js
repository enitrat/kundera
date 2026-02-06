import { BYTES_PER_WORD } from "./constants.js";

/**
 * Get the total byte length of a ByteArray
 *
 * @param {import('./types.js').ByteArrayType} byteArray
 * @returns {number}
 */
export function length(byteArray) {
	return byteArray.data.length * BYTES_PER_WORD + byteArray.pendingWordLen;
}
