/**
 * Convert Uint256 to hex string
 *
 * @param {import('./types.js').Uint256Type} uint - Uint256 value
 * @returns {string} hex string with 0x prefix
 */
export function toHex(uint) {
	return "0x" + /** @type {bigint} */ (uint).toString(16);
}
