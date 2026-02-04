import { MIN, MAX } from './constants.js';
import { Int64RangeError, Int64ParseError } from './errors.js';
import type { Int64Type, Int64Input } from './types.js';

/**
 * Create an Int64 from various input types.
 *
 * @param value - The value to convert (bigint, number, or string)
 * @returns A branded Int64Type
 * @throws Int64RangeError if value is outside [MIN, MAX]
 * @throws Int64ParseError if string cannot be parsed
 */
export function from(value: Int64Input): Int64Type {
  let bigintValue: bigint;

  if (typeof value === 'bigint') {
    bigintValue = value;
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Int64ParseError(String(value), 'value must be an integer');
    }
    bigintValue = BigInt(value);
  } else if (typeof value === 'string') {
    try {
      bigintValue = BigInt(value);
    } catch {
      throw new Int64ParseError(value, 'invalid integer string');
    }
  } else {
    // Already Int64Type (branded bigint)
    return value;
  }

  if (bigintValue < MIN || bigintValue > MAX) {
    throw new Int64RangeError(bigintValue);
  }

  return bigintValue as Int64Type;
}
