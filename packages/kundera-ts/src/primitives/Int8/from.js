import { MIN, MAX } from "./constants.js";
import { Int8RangeError, Int8ParseError } from "./errors.js";

/**
 * Create an Int8 from various input types.
 *
 * @param {import('./types.js').Int8Input} value - The value to convert (bigint, number, or string)
 * @returns {import('./types.js').Int8Type} A branded Int8Type
 * @throws {Int8RangeError} if value is outside [MIN, MAX]
 * @throws {Int8ParseError} if string cannot be parsed
 */
export function from(value) {
	/** @type {bigint} */
	let bigintValue;

	if (typeof value === "bigint") {
		bigintValue = value;
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new Int8ParseError(String(value), "value must be an integer");
		}
		bigintValue = BigInt(value);
	} else if (typeof value === "string") {
		try {
			bigintValue = BigInt(value);
		} catch {
			throw new Int8ParseError(value, "invalid integer string");
		}
	} else {
		// Already Int8Type (branded bigint)
		return value;
	}

	if (bigintValue < MIN || bigintValue > MAX) {
		throw new Int8RangeError(bigintValue);
	}

	return /** @type {import('./types.js').Int8Type} */ (bigintValue);
}
