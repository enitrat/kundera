import { MAX, MIN, PRIME, SIZE } from "./constants.js";
import { from } from "./from.js";
import { fromFelt } from "./fromFelt.js";
import { toBigInt } from "./toBigInt.js";
import { toFelt } from "./toFelt.js";
import { toHex } from "./toHex.js";

const int32Zero = from(0n);
const int32One = from(1n);
const int32Min = from(MIN);
const int32Max = from(MAX);

/**
 * Utility functions for Int32 signed integers.
 */
export const Int32 = Object.assign(from, {
	from,
	toBigInt,
	toHex,
	toFelt,
	fromFelt,

	/**
	 * Check if an Int32 is valid (always true for properly constructed values)
	 * @param {import('./types.js').Int32Type} value
	 * @returns {boolean}
	 */
	isValid: (value) => {
		const v = /** @type {bigint} */ (value);
		return v >= MIN && v <= MAX;
	},

	/**
	 * Check if an Int32 is zero
	 * @param {import('./types.js').Int32Type} value
	 * @returns {boolean}
	 */
	isZero: (value) => {
		return /** @type {bigint} */ (value) === 0n;
	},

	/**
	 * Check if an Int32 is negative (< 0)
	 * @param {import('./types.js').Int32Type} value
	 * @returns {boolean}
	 */
	isNegative: (value) => {
		return /** @type {bigint} */ (value) < 0n;
	},

	/**
	 * Check if an Int32 is positive (> 0)
	 * @param {import('./types.js').Int32Type} value
	 * @returns {boolean}
	 */
	isPositive: (value) => {
		return /** @type {bigint} */ (value) > 0n;
	},

	/**
	 * Check if two Int32 values are equal
	 * @param {import('./types.js').Int32Type} a
	 * @param {import('./types.js').Int32Type} b
	 * @returns {boolean}
	 */
	equals: (a, b) => {
		return /** @type {bigint} */ (a) === /** @type {bigint} */ (b);
	},

	// Constants
	ZERO: int32Zero,
	ONE: int32One,
	MIN: int32Min,
	MAX: int32Max,
	SIZE,
	PRIME,
});
