import { MIN, MAX, SIZE, PRIME } from './constants.js';
import { from } from './from.js';
import { toBigInt } from './toBigInt.js';
import { toHex } from './toHex.js';
import { toFelt } from './toFelt.js';
import { fromFelt } from './fromFelt.js';
import type { Int8Type, Int8Input } from './types.js';

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
   */
  isValid: (value: Int8Type): boolean => {
    const v = value as bigint;
    return v >= MIN && v <= MAX;
  },

  /**
   * Check if an Int8 is zero
   */
  isZero: (value: Int8Type): boolean => {
    return (value as bigint) === 0n;
  },

  /**
   * Check if an Int8 is negative (< 0)
   */
  isNegative: (value: Int8Type): boolean => {
    return (value as bigint) < 0n;
  },

  /**
   * Check if an Int8 is positive (> 0)
   */
  isPositive: (value: Int8Type): boolean => {
    return (value as bigint) > 0n;
  },

  /**
   * Check if two Int8 values are equal
   */
  equals: (a: Int8Type, b: Int8Type): boolean => {
    return (a as bigint) === (b as bigint);
  },

  // Constants
  ZERO: int8Zero,
  ONE: int8One,
  MIN: int8Min,
  MAX: int8Max,
  SIZE,
  PRIME,
});
