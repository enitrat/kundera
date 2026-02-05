/**
 * Convert Uint128 to bigint
 *
 * @param {import('./types.js').Uint128Type} uint - Uint128 value
 * @returns {bigint} bigint value
 */
export function toBigInt(uint) {
  return /** @type {bigint} */ (uint);
}
