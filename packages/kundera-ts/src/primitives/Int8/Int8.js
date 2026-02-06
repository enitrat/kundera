import { MIN, MAX, SIZE, PRIME } from "./constants.js";
import { from } from "./from.js";
import { toBigInt } from "./toBigInt.js";
import { toHex } from "./toHex.js";
import { toFelt } from "./toFelt.js";
import { fromFelt } from "./fromFelt.js";

const int8Zero = from(0n);
const int8One = from(1n);
const int8Min = from(MIN);
const int8Max = from(MAX);

/**
 * Utility functions for Int8 signed integers.
 */
export const Int8 = Object.assign(from, {
	from,
	toBigInt,
	toHex,
	toFelt,
	fromFelt,

	/**
	 * Check if an Int8 is valid (always true for properly constructed values)
	 * @param {import('./types.js').Int8Type} value
	 * @returns {boolean}
	 */
	isValid: (value) => {
		const v = /** @type {bigint} */ (value);
		return v >= MIN && v <= MAX;
	},

	/**
	 * Check if an Int8 is zero
	 * @param {import('./types.js').Int8Type} value
	 * @returns {boolean}
	 */
	isZero: (value) => {
		return /** @type {bigint} */ (value) === 0n;
	},

	/**
	 * Check if an Int8 is negative (< 0)
	 * @param {import('./types.js').Int8Type} value
	 * @returns {boolean}
	 */
	isNegative: (value) => {
		return /** @type {bigint} */ (value) < 0n;
	},

	/**
	 * Check if an Int8 is positive (> 0)
	 * @param {import('./types.js').Int8Type} value
	 * @returns {boolean}
	 */
	isPositive: (value) => {
		return /** @type {bigint} */ (value) > 0n;
	},

	/**
	 * Check if two Int8 values are equal
	 * @param {import('./types.js').Int8Type} a
	 * @param {import('./types.js').Int8Type} b
	 * @returns {boolean}
	 */
	equals: (a, b) => {
		return /** @type {bigint} */ (a) === /** @type {bigint} */ (b);
	},

	// Constants
	ZERO: int8Zero,
	ONE: int8One,
	MIN: int8Min,
	MAX: int8Max,
	SIZE,
	PRIME,
});
