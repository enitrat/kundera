import { MIN, MAX } from './constants.js';
import { Int16RangeError, Int16ParseError } from './errors.js';
import type { Int16Type, Int16Input } from './types.js';

/**
 * Create an Int16 from various input types.
 *
 * @param value - The value to convert (bigint, number, or string)
 * @returns A branded Int16Type
 * @throws Int16RangeError if value is outside [MIN, MAX]
 * @throws Int16ParseError if string cannot be parsed
 */
export function from(value: Int16Input): Int16Type {
  let bigintValue: bigint;

  if (typeof value === 'bigint') {
    bigintValue = value;
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Int16ParseError(String(value), 'value must be an integer');
    }
    bigintValue = BigInt(value);
  } else if (typeof value === 'string') {
    try {
      bigintValue = BigInt(value);
    } catch {
      throw new Int16ParseError(value, 'invalid integer string');
    }
  } else {
    // Already Int16Type (branded bigint)
    return value;
  }

  if (bigintValue < MIN || bigintValue > MAX) {
    throw new Int16RangeError(bigintValue);
  }

  return bigintValue as Int16Type;
}
