/**
 * Convert Uint256 to bigint
 *
 * @param {import('./types.js').Uint256Type} uint - Uint256 value
 * @returns {bigint} bigint value
 */
export function toBigInt(uint) {
  return /** @type {bigint} */ (uint);
}
