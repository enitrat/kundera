import { MIN, MAX, SIZE, PRIME } from './constants.js';
import { from } from './from.js';
import { toBigInt } from './toBigInt.js';
import { toHex } from './toHex.js';
import { toFelt } from './toFelt.js';
import { fromFelt } from './fromFelt.js';
import type { Int128Type, Int128Input } from './types.js';

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
   */
  isValid: (value: Int128Type): boolean => {
    const v = value as bigint;
    return v >= MIN && v <= MAX;
  },

  /**
   * Check if an Int128 is zero
   */
  isZero: (value: Int128Type): boolean => {
    return (value as bigint) === 0n;
  },

  /**
   * Check if an Int128 is negative (< 0)
   */
  isNegative: (value: Int128Type): boolean => {
    return (value as bigint) < 0n;
  },

  /**
   * Check if an Int128 is positive (> 0)
   */
  isPositive: (value: Int128Type): boolean => {
    return (value as bigint) > 0n;
  },

  /**
   * Check if two Int128 values are equal
   */
  equals: (a: Int128Type, b: Int128Type): boolean => {
    return (a as bigint) === (b as bigint);
  },

  // Constants
  ZERO: int128Zero,
  ONE: int128One,
  MIN: int128Min,
  MAX: int128Max,
  SIZE,
  PRIME,
});
