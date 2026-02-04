import { MAX } from './constants.js';
import { Uint256NegativeError, Uint256NotIntegerError, Uint256OverflowError } from './errors.js';
import type { Uint256Type } from './types.js';

/**
 * Create Uint256 from bigint, number, or string
 *
 * @param value - bigint, number, or decimal/hex string
 * @returns Uint256 value
 * @throws {Uint256NotIntegerError} If number is not an integer
 * @throws {Uint256NegativeError} If value is negative
 * @throws {Uint256OverflowError} If value exceeds maximum
 */
export function from(value: bigint | number | string): Uint256Type {
  let bigintValue: bigint;

  if (typeof value === 'string') {
    bigintValue = BigInt(value);
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Uint256NotIntegerError(value);
    }
    bigintValue = BigInt(value);
  } else {
    bigintValue = value;
  }

  if (bigintValue < 0n) {
    throw new Uint256NegativeError(bigintValue);
  }

  if (bigintValue > MAX) {
    throw new Uint256OverflowError(bigintValue);
  }

  return bigintValue as Uint256Type;
}
