/**
 * Convert an Int128 to its bigint value.
 *
 * @param {import('./types.js').Int128Type} value - The Int128 to convert
 * @returns {bigint} The signed bigint value
 */
export function toBigInt(value) {
  return /** @type {bigint} */ (value);
}
