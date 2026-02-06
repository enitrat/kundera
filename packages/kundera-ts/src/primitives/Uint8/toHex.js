/**
 * Convert Uint8 to hex string
 *
 * @param {import('./types.js').Uint8Type} uint - Uint8 value
 * @returns {string} Hex string with 0x prefix
 */
export function toHex(uint) {
	return `0x${uint.toString(16)}`;
}
