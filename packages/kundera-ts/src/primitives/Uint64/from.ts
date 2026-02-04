import { MAX } from './constants.js';
import { Uint64NegativeError, Uint64NotIntegerError, Uint64OverflowError } from './errors.js';
import type { Uint64Type } from './types.js';

/**
 * Create Uint64 from bigint, number, or string
 *
 * @param value - bigint, number, or decimal/hex string
 * @returns Uint64 value
 * @throws {Uint64NotIntegerError} If number is not an integer
 * @throws {Uint64NegativeError} If value is negative
 * @throws {Uint64OverflowError} If value exceeds maximum
 */
export function from(value: bigint | number | string): Uint64Type {
  let bigintValue: bigint;

  if (typeof value === 'string') {
    bigintValue = BigInt(value);
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Uint64NotIntegerError(value);
    }
    bigintValue = BigInt(value);
  } else {
    bigintValue = value;
  }

  if (bigintValue < 0n) {
    throw new Uint64NegativeError(bigintValue);
  }

  if (bigintValue > MAX) {
    throw new Uint64OverflowError(bigintValue);
  }

  return bigintValue as Uint64Type;
}
