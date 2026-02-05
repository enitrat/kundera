import { MIN, MAX } from './constants.js';

export class Int128RangeError extends RangeError {
  /**
   * @param {bigint} value
   */
  constructor(value) {
    super(
      `Int128 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`
    );
    this.name = 'Int128RangeError';
  }
}

export class Int128ParseError extends Error {
  /**
   * @param {string} input
   * @param {string} reason
   */
  constructor(input, reason) {
    super(`Failed to parse "${input}" as Int128: ${reason}`);
    this.name = 'Int128ParseError';
  }
}
