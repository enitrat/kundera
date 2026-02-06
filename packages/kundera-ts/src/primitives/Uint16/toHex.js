/**
 * Convert Uint16 to hex string
 *
 * @param {import('./types.js').Uint16Type} uint - Uint16 value
 * @returns {string} Hex string with 0x prefix
 */
export function toHex(uint) {
	return `0x${uint.toString(16)}`;
}
