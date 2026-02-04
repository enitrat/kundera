import { MAX } from './constants.js';
import { Uint16NegativeError, Uint16NotIntegerError, Uint16OverflowError } from './errors.js';
import type { Uint16Type } from './types.js';

/**
 * Create Uint16 from bigint, number, or string
 *
 * @param value - bigint, number, or decimal/hex string
 * @returns Uint16 value
 * @throws {Uint16NotIntegerError} If number is not an integer
 * @throws {Uint16NegativeError} If value is negative
 * @throws {Uint16OverflowError} If value exceeds maximum
 */
export function from(value: bigint | number | string): Uint16Type {
  let bigintValue: bigint;

  if (typeof value === 'string') {
    bigintValue = BigInt(value);
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Uint16NotIntegerError(value);
    }
    bigintValue = BigInt(value);
  } else {
    bigintValue = value;
  }

  if (bigintValue < 0n) {
    throw new Uint16NegativeError(bigintValue);
  }

  if (bigintValue > MAX) {
    throw new Uint16OverflowError(bigintValue);
  }

  return bigintValue as Uint16Type;
}
