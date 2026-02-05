/**
 * Error thrown when Uint16 value is negative
 */
export class Uint16NegativeError extends Error {
  /**
   * @param {bigint | number} value
   */
  constructor(value) {
    super(`Uint16 value cannot be negative: ${value}`);
    this.name = 'Uint16NegativeError';
  }
}

/**
 * Error thrown when Uint16 value exceeds maximum (65535)
 */
export class Uint16OverflowError extends Error {
  /**
   * @param {bigint | number} value
   */
  constructor(value) {
    super(`Uint16 value exceeds maximum (65535): ${value}`);
    this.name = 'Uint16OverflowError';
  }
}

/**
 * Error thrown when Uint16 value is not an integer
 */
export class Uint16NotIntegerError extends Error {
  /**
   * @param {number} value
   */
  constructor(value) {
    super(`Uint16 value must be an integer: ${value}`);
    this.name = 'Uint16NotIntegerError';
  }
}
