import { MIN, MAX, SIZE, PRIME } from './constants.js';
import { from } from './from.js';
import { toBigInt } from './toBigInt.js';
import { toHex } from './toHex.js';
import { toFelt } from './toFelt.js';
import { fromFelt } from './fromFelt.js';
import type { Int32Type, Int32Input } from './types.js';

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
   */
  isValid: (value: Int32Type): boolean => {
    const v = value as bigint;
    return v >= MIN && v <= MAX;
  },

  /**
   * Check if an Int32 is zero
   */
  isZero: (value: Int32Type): boolean => {
    return (value as bigint) === 0n;
  },

  /**
   * Check if an Int32 is negative (< 0)
   */
  isNegative: (value: Int32Type): boolean => {
    return (value as bigint) < 0n;
  },

  /**
   * Check if an Int32 is positive (> 0)
   */
  isPositive: (value: Int32Type): boolean => {
    return (value as bigint) > 0n;
  },

  /**
   * Check if two Int32 values are equal
   */
  equals: (a: Int32Type, b: Int32Type): boolean => {
    return (a as bigint) === (b as bigint);
  },

  // Constants
  ZERO: int32Zero,
  ONE: int32One,
  MIN: int32Min,
  MAX: int32Max,
  SIZE,
  PRIME,
});
