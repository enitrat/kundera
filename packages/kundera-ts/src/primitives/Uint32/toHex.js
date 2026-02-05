/**
 * Convert Uint32 to hex string
 *
 * @param {import('./types.js').Uint32Type} uint - Uint32 value
 * @returns {string} Hex string with 0x prefix
 */
export function toHex(uint) {
  return `0x${uint.toString(16)}`;
}
