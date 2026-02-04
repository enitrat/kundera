import { MIN, MAX, SIZE, PRIME } from './constants.js';
import { from } from './from.js';
import { toBigInt } from './toBigInt.js';
import { toHex } from './toHex.js';
import { toFelt } from './toFelt.js';
import { fromFelt } from './fromFelt.js';
import type { Int16Type, Int16Input } from './types.js';

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
   */
  isValid: (value: Int16Type): boolean => {
    const v = value as bigint;
    return v >= MIN && v <= MAX;
  },

  /**
   * Check if an Int16 is zero
   */
  isZero: (value: Int16Type): boolean => {
    return (value as bigint) === 0n;
  },

  /**
   * Check if an Int16 is negative (< 0)
   */
  isNegative: (value: Int16Type): boolean => {
    return (value as bigint) < 0n;
  },

  /**
   * Check if an Int16 is positive (> 0)
   */
  isPositive: (value: Int16Type): boolean => {
    return (value as bigint) > 0n;
  },

  /**
   * Check if two Int16 values are equal
   */
  equals: (a: Int16Type, b: Int16Type): boolean => {
    return (a as bigint) === (b as bigint);
  },

  // Constants
  ZERO: int16Zero,
  ONE: int16One,
  MIN: int16Min,
  MAX: int16Max,
  SIZE,
  PRIME,
});
