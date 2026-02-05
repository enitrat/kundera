import { MIN, MAX, SIZE, PRIME } from './constants.js';
import { from } from './from.js';
import { toBigInt } from './toBigInt.js';
import { toHex } from './toHex.js';
import { toFelt } from './toFelt.js';
import { fromFelt } from './fromFelt.js';

const int64Zero = from(0n);
const int64One = from(1n);
const int64Min = from(MIN);
const int64Max = from(MAX);

/**
 * Utility functions for Int64 signed integers.
 */
export const Int64 = Object.assign(from, {
  from,
  toBigInt,
  toHex,
  toFelt,
  fromFelt,

  /**
   * Check if an Int64 is valid (always true for properly constructed values)
   * @param {import('./types.js').Int64Type} value
   * @returns {boolean}
   */
  isValid: (value) => {
    const v = /** @type {bigint} */ (value);
    return v >= MIN && v <= MAX;
  },

  /**
   * Check if an Int64 is zero
   * @param {import('./types.js').Int64Type} value
   * @returns {boolean}
   */
  isZero: (value) => {
    return /** @type {bigint} */ (value) === 0n;
  },

  /**
   * Check if an Int64 is negative (< 0)
   * @param {import('./types.js').Int64Type} value
   * @returns {boolean}
   */
  isNegative: (value) => {
    return /** @type {bigint} */ (value) < 0n;
  },

  /**
   * Check if an Int64 is positive (> 0)
   * @param {import('./types.js').Int64Type} value
   * @returns {boolean}
   */
  isPositive: (value) => {
    return /** @type {bigint} */ (value) > 0n;
  },

  /**
   * Check if two Int64 values are equal
   * @param {import('./types.js').Int64Type} a
   * @param {import('./types.js').Int64Type} b
   * @returns {boolean}
   */
  equals: (a, b) => {
    return /** @type {bigint} */ (a) === /** @type {bigint} */ (b);
  },

  // Constants
  ZERO: int64Zero,
  ONE: int64One,
  MIN: int64Min,
  MAX: int64Max,
  SIZE,
  PRIME,
});
