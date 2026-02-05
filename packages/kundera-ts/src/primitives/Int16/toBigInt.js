/**
 * Convert an Int16 to its bigint value.
 *
 * @param {import('./types.js').Int16Type} value - The Int16 to convert
 * @returns {bigint} The signed bigint value
 */
export function toBigInt(value) {
  return /** @type {bigint} */ (value);
}
