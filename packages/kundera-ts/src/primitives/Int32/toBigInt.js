/**
 * Convert an Int32 to its bigint value.
 *
 * @param {import('./types.js').Int32Type} value - The Int32 to convert
 * @returns {bigint} The signed bigint value
 */
export function toBigInt(value) {
  return /** @type {bigint} */ (value);
}
