/**
 * Convert an Int8 to its bigint value.
 *
 * @param {import('./types.js').Int8Type} value - The Int8 to convert
 * @returns {bigint} The signed bigint value
 */
export function toBigInt(value) {
  return /** @type {bigint} */ (value);
}
