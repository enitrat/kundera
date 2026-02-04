/**
 * Error thrown when Uint32 value is negative
 */
export class Uint32NegativeError extends Error {
  constructor(value: bigint | number) {
    super(`Uint32 value cannot be negative: ${value}`);
    this.name = 'Uint32NegativeError';
  }
}

/**
 * Error thrown when Uint32 value exceeds maximum (4294967295)
 */
export class Uint32OverflowError extends Error {
  constructor(value: bigint | number) {
    super(`Uint32 value exceeds maximum (4294967295): ${value}`);
    this.name = 'Uint32OverflowError';
  }
}

/**
 * Error thrown when Uint32 value is not an integer
 */
export class Uint32NotIntegerError extends Error {
  constructor(value: number) {
    super(`Uint32 value must be an integer: ${value}`);
    this.name = 'Uint32NotIntegerError';
  }
}
