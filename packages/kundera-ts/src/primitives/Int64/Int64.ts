import { MIN, MAX, SIZE, PRIME } from './constants.js';
import { from } from './from.js';
import { toBigInt } from './toBigInt.js';
import { toHex } from './toHex.js';
import { toFelt } from './toFelt.js';
import { fromFelt } from './fromFelt.js';
import type { Int64Type, Int64Input } from './types.js';

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
   */
  isValid: (value: Int64Type): boolean => {
    const v = value as bigint;
    return v >= MIN && v <= MAX;
  },

  /**
   * Check if an Int64 is zero
   */
  isZero: (value: Int64Type): boolean => {
    return (value as bigint) === 0n;
  },

  /**
   * Check if an Int64 is negative (< 0)
   */
  isNegative: (value: Int64Type): boolean => {
    return (value as bigint) < 0n;
  },

  /**
   * Check if an Int64 is positive (> 0)
   */
  isPositive: (value: Int64Type): boolean => {
    return (value as bigint) > 0n;
  },

  /**
   * Check if two Int64 values are equal
   */
  equals: (a: Int64Type, b: Int64Type): boolean => {
    return (a as bigint) === (b as bigint);
  },

  // Constants
  ZERO: int64Zero,
  ONE: int64One,
  MIN: int64Min,
  MAX: int64Max,
  SIZE,
  PRIME,
});
