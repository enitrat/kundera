import { MIN, MAX, SIZE, PRIME } from "./constants.js";
import { from } from "./from.js";
import { toBigInt } from "./toBigInt.js";
import { toHex } from "./toHex.js";
import { toFelt } from "./toFelt.js";
import { fromFelt } from "./fromFelt.js";

const int128Zero = from(0n);
const int128One = from(1n);
const int128Min = from(MIN);
const int128Max = from(MAX);

/**
 * Utility functions for Int128 signed integers.
 */
export const Int128 = Object.assign(from, {
	from,
	toBigInt,
	toHex,
	toFelt,
	fromFelt,

	/**
	 * Check if an Int128 is valid (always true for properly constructed values)
	 * @param {import('./types.js').Int128Type} value
	 * @returns {boolean}
	 */
	isValid: (value) => {
		const v = /** @type {bigint} */ (value);
		return v >= MIN && v <= MAX;
	},

	/**
	 * Check if an Int128 is zero
	 * @param {import('./types.js').Int128Type} value
	 * @returns {boolean}
	 */
	isZero: (value) => {
		return /** @type {bigint} */ (value) === 0n;
	},

	/**
	 * Check if an Int128 is negative (< 0)
	 * @param {import('./types.js').Int128Type} value
	 * @returns {boolean}
	 */
	isNegative: (value) => {
		return /** @type {bigint} */ (value) < 0n;
	},

	/**
	 * Check if an Int128 is positive (> 0)
	 * @param {import('./types.js').Int128Type} value
	 * @returns {boolean}
	 */
	isPositive: (value) => {
		return /** @type {bigint} */ (value) > 0n;
	},

	/**
	 * Check if two Int128 values are equal
	 * @param {import('./types.js').Int128Type} a
	 * @param {import('./types.js').Int128Type} b
	 * @returns {boolean}
	 */
	equals: (a, b) => {
		return /** @type {bigint} */ (a) === /** @type {bigint} */ (b);
	},

	// Constants
	ZERO: int128Zero,
	ONE: int128One,
	MIN: int128Min,
	MAX: int128Max,
	SIZE,
	PRIME,
});
