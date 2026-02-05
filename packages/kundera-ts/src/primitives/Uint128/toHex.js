/**
 * Convert Uint128 to hex string
 *
 * @param {import('./types.js').Uint128Type} uint - Uint128 value
 * @returns {string} hex string with 0x prefix
 */
export function toHex(uint) {
  return '0x' + /** @type {bigint} */ (uint).toString(16);
}
