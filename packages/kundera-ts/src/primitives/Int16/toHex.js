/**
 * Convert an Int16 to its hexadecimal string representation.
 *
 * For negative values, returns a string with a minus sign prefix
 * followed by 0x and the absolute value in hex.
 *
 * @param {import('./types.js').Int16Type} value - The Int16 to convert
 * @returns {string} Hexadecimal string (e.g., "0xff" or "-0x1")
 */
export function toHex(value) {
	const bigintValue = /** @type {bigint} */ (value);

	if (bigintValue < 0n) {
		return `-0x${(-bigintValue).toString(16)}`;
	}

	return `0x${bigintValue.toString(16)}`;
}
