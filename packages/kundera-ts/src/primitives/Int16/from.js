import { MAX, MIN } from "./constants.js";
import { Int16ParseError, Int16RangeError } from "./errors.js";

/**
 * Create an Int16 from various input types.
 *
 * @param {import('./types.js').Int16Input} value - The value to convert (bigint, number, or string)
 * @returns {import('./types.js').Int16Type} A branded Int16Type
 * @throws {Int16RangeError} if value is outside [MIN, MAX]
 * @throws {Int16ParseError} if string cannot be parsed
 */
export function from(value) {
	/** @type {bigint} */
	let bigintValue;

	if (typeof value === "bigint") {
		bigintValue = value;
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new Int16ParseError(String(value), "value must be an integer");
		}
		bigintValue = BigInt(value);
	} else if (typeof value === "string") {
		try {
			bigintValue = BigInt(value);
		} catch {
			throw new Int16ParseError(value, "invalid integer string");
		}
	} else {
		// Already Int16Type (branded bigint)
		return value;
	}

	if (bigintValue < MIN || bigintValue > MAX) {
		throw new Int16RangeError(bigintValue);
	}

	return /** @type {import('./types.js').Int16Type} */ (bigintValue);
}
