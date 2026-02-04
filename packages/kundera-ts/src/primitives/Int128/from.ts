import { MIN, MAX } from './constants.js';
import { Int128RangeError, Int128ParseError } from './errors.js';
import type { Int128Type, Int128Input } from './types.js';

/**
 * Create an Int128 from various input types.
 *
 * @param value - The value to convert (bigint, number, or string)
 * @returns A branded Int128Type
 * @throws Int128RangeError if value is outside [MIN, MAX]
 * @throws Int128ParseError if string cannot be parsed
 */
export function from(value: Int128Input): Int128Type {
  let bigintValue: bigint;

  if (typeof value === 'bigint') {
    bigintValue = value;
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Int128ParseError(String(value), 'value must be an integer');
    }
    bigintValue = BigInt(value);
  } else if (typeof value === 'string') {
    try {
      bigintValue = BigInt(value);
    } catch {
      throw new Int128ParseError(value, 'invalid integer string');
    }
  } else {
    // Already Int128Type (branded bigint)
    return value;
  }

  if (bigintValue < MIN || bigintValue > MAX) {
    throw new Int128RangeError(bigintValue);
  }

  return bigintValue as Int128Type;
}
