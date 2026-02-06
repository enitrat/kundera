import { MIN, MAX } from "./constants.js";
import { Int64RangeError, Int64ParseError } from "./errors.js";

/**
 * Create an Int64 from various input types.
 *
 * @param {import('./types.js').Int64Input} value - The value to convert (bigint, number, or string)
 * @returns {import('./types.js').Int64Type} A branded Int64Type
 * @throws {Int64RangeError} if value is outside [MIN, MAX]
 * @throws {Int64ParseError} if string cannot be parsed
 */
export function from(value) {
	/** @type {bigint} */
	let bigintValue;

	if (typeof value === "bigint") {
		bigintValue = value;
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new Int64ParseError(String(value), "value must be an integer");
		}
		bigintValue = BigInt(value);
	} else if (typeof value === "string") {
		try {
			bigintValue = BigInt(value);
		} catch {
			throw new Int64ParseError(value, "invalid integer string");
		}
	} else {
		// Already Int64Type (branded bigint)
		return value;
	}

	if (bigintValue < MIN || bigintValue > MAX) {
		throw new Int64RangeError(bigintValue);
	}

	return /** @type {import('./types.js').Int64Type} */ (bigintValue);
}
