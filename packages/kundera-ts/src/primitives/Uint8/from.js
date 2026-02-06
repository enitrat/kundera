import { MAX } from "./constants.js";
import {
	Uint8NegativeError,
	Uint8NotIntegerError,
	Uint8OverflowError,
} from "./errors.js";

/**
 * Create Uint8 from bigint, number, or string
 *
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./types.js').Uint8Type} Uint8 value
 * @throws {Uint8NotIntegerError} If number is not an integer
 * @throws {Uint8NegativeError} If value is negative
 * @throws {Uint8OverflowError} If value exceeds maximum
 */
export function from(value) {
	/** @type {bigint} */
	let bigintValue;

	if (typeof value === "string") {
		bigintValue = BigInt(value);
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new Uint8NotIntegerError(value);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new Uint8NegativeError(bigintValue);
	}

	if (bigintValue > MAX) {
		throw new Uint8OverflowError(bigintValue);
	}

	return /** @type {import('./types.js').Uint8Type} */ (bigintValue);
}
