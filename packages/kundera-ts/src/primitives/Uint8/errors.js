/**
 * Error thrown when Uint8 value is negative
 */
export class Uint8NegativeError extends Error {
  /**
   * @param {bigint | number} value
   */
  constructor(value) {
    super(`Uint8 value cannot be negative: ${value}`);
    this.name = 'Uint8NegativeError';
  }
}

/**
 * Error thrown when Uint8 value exceeds maximum (255)
 */
export class Uint8OverflowError extends Error {
  /**
   * @param {bigint | number} value
   */
  constructor(value) {
    super(`Uint8 value exceeds maximum (255): ${value}`);
    this.name = 'Uint8OverflowError';
  }
}

/**
 * Error thrown when Uint8 value is not an integer
 */
export class Uint8NotIntegerError extends Error {
  /**
   * @param {number} value
   */
  constructor(value) {
    super(`Uint8 value must be an integer: ${value}`);
    this.name = 'Uint8NotIntegerError';
  }
}
