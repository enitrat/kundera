import { MAX } from './constants.js';
import { Uint256NegativeError, Uint256NotIntegerError, Uint256OverflowError } from './errors.js';

/**
 * Create Uint256 from bigint, number, or string
 *
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./types.js').Uint256Type} Uint256 value
 * @throws {Uint256NotIntegerError} If number is not an integer
 * @throws {Uint256NegativeError} If value is negative
 * @throws {Uint256OverflowError} If value exceeds maximum
 */
export function from(value) {
  /** @type {bigint} */
  let bigintValue;

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

  return /** @type {import('./types.js').Uint256Type} */ (bigintValue);
}
