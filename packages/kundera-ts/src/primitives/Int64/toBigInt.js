/**
 * Convert an Int64 to its bigint value.
 *
 * @param {import('./types.js').Int64Type} value - The Int64 to convert
 * @returns {bigint} The signed bigint value
 */
export function toBigInt(value) {
	return /** @type {bigint} */ (value);
}
