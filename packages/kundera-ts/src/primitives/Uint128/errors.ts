/**
 * Error thrown when Uint128 value is negative
 */
export class Uint128NegativeError extends Error {
  constructor(value: bigint) {
    super(`Uint128 value cannot be negative: ${value}`);
    this.name = 'Uint128NegativeError';
  }
}

/**
 * Error thrown when Uint128 value exceeds maximum
 */
export class Uint128OverflowError extends Error {
  constructor(value: bigint) {
    super(`Uint128 value exceeds maximum: ${value}`);
    this.name = 'Uint128OverflowError';
  }
}

/**
 * Error thrown when number is not an integer
 */
export class Uint128NotIntegerError extends Error {
  constructor(value: number) {
    super(`Uint128 value must be an integer: ${value}`);
    this.name = 'Uint128NotIntegerError';
  }
}
