import { MIN, MAX } from './constants.js';
import { Int32RangeError, Int32ParseError } from './errors.js';
import type { Int32Type, Int32Input } from './types.js';

/**
 * Create an Int32 from various input types.
 *
 * @param value - The value to convert (bigint, number, or string)
 * @returns A branded Int32Type
 * @throws Int32RangeError if value is outside [MIN, MAX]
 * @throws Int32ParseError if string cannot be parsed
 */
export function from(value: Int32Input): Int32Type {
  let bigintValue: bigint;

  if (typeof value === 'bigint') {
    bigintValue = value;
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Int32ParseError(String(value), 'value must be an integer');
    }
    bigintValue = BigInt(value);
  } else if (typeof value === 'string') {
    try {
      bigintValue = BigInt(value);
    } catch {
      throw new Int32ParseError(value, 'invalid integer string');
    }
  } else {
    // Already Int32Type (branded bigint)
    return value;
  }

  if (bigintValue < MIN || bigintValue > MAX) {
    throw new Int32RangeError(bigintValue);
  }

  return bigintValue as Int32Type;
}
