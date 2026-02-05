/**
 * Convert Uint64 to hex string
 *
 * @param {import('./types.js').Uint64Type} uint - Uint64 value
 * @returns {string} Hex string with 0x prefix
 */
export function toHex(uint) {
  return `0x${uint.toString(16)}`;
}
