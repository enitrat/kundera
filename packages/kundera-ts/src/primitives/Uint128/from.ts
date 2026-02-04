import { MAX } from './constants.js';
import { Uint128NegativeError, Uint128NotIntegerError, Uint128OverflowError } from './errors.js';
import type { Uint128Type } from './types.js';

/**
 * Create Uint128 from bigint, number, or string
 *
 * @param value - bigint, number, or decimal/hex string
 * @returns Uint128 value
 * @throws {Uint128NotIntegerError} If number is not an integer
 * @throws {Uint128NegativeError} If value is negative
 * @throws {Uint128OverflowError} If value exceeds maximum
 */
export function from(value: bigint | number | string): Uint128Type {
  let bigintValue: bigint;

  if (typeof value === 'string') {
    bigintValue = BigInt(value);
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Uint128NotIntegerError(value);
    }
    bigintValue = BigInt(value);
  } else {
    bigintValue = value;
  }

  if (bigintValue < 0n) {
    throw new Uint128NegativeError(bigintValue);
  }

  if (bigintValue > MAX) {
    throw new Uint128OverflowError(bigintValue);
  }

  return bigintValue as Uint128Type;
}
