import { MAX } from "./constants.js";
import {
	Uint32NegativeError,
	Uint32NotIntegerError,
	Uint32OverflowError,
} from "./errors.js";

/**
 * Create Uint32 from bigint, number, or string
 *
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./types.js').Uint32Type} Uint32 value
 * @throws {Uint32NotIntegerError} If number is not an integer
 * @throws {Uint32NegativeError} If value is negative
 * @throws {Uint32OverflowError} If value exceeds maximum
 */
export function from(value) {
	/** @type {bigint} */
	let bigintValue;

	if (typeof value === "string") {
		bigintValue = BigInt(value);
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new Uint32NotIntegerError(value);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new Uint32NegativeError(bigintValue);
	}

	if (bigintValue > MAX) {
		throw new Uint32OverflowError(bigintValue);
	}

	return /** @type {import('./types.js').Uint32Type} */ (bigintValue);
}
