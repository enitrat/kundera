import { MAX, MIN, PRIME, SIZE } from "./constants.js";
import { from } from "./from.js";
import { fromFelt } from "./fromFelt.js";
import { toBigInt } from "./toBigInt.js";
import { toFelt } from "./toFelt.js";
import { toHex } from "./toHex.js";

const int16Zero = from(0n);
const int16One = from(1n);
const int16Min = from(MIN);
const int16Max = from(MAX);

/**
 * Utility functions for Int16 signed integers.
 */
export const Int16 = Object.assign(from, {
	from,
	toBigInt,
	toHex,
	toFelt,
	fromFelt,

	/**
	 * Check if an Int16 is valid (always true for properly constructed values)
	 * @param {import('./types.js').Int16Type} value
	 * @returns {boolean}
	 */
	isValid: (value) => {
		const v = /** @type {bigint} */ (value);
		return v >= MIN && v <= MAX;
	},

	/**
	 * Check if an Int16 is zero
	 * @param {import('./types.js').Int16Type} value
	 * @returns {boolean}
	 */
	isZero: (value) => {
		return /** @type {bigint} */ (value) === 0n;
	},

	/**
	 * Check if an Int16 is negative (< 0)
	 * @param {import('./types.js').Int16Type} value
	 * @returns {boolean}
	 */
	isNegative: (value) => {
		return /** @type {bigint} */ (value) < 0n;
	},

	/**
	 * Check if an Int16 is positive (> 0)
	 * @param {import('./types.js').Int16Type} value
	 * @returns {boolean}
	 */
	isPositive: (value) => {
		return /** @type {bigint} */ (value) > 0n;
	},

	/**
	 * Check if two Int16 values are equal
	 * @param {import('./types.js').Int16Type} a
	 * @param {import('./types.js').Int16Type} b
	 * @returns {boolean}
	 */
	equals: (a, b) => {
		return /** @type {bigint} */ (a) === /** @type {bigint} */ (b);
	},

	// Constants
	ZERO: int16Zero,
	ONE: int16One,
	MIN: int16Min,
	MAX: int16Max,
	SIZE,
	PRIME,
});
