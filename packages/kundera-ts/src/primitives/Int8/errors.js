import { MIN, MAX } from './constants.js';

export class Int8RangeError extends RangeError {
  /**
   * @param {bigint} value
   */
  constructor(value) {
    super(
      `Int8 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`
    );
    this.name = 'Int8RangeError';
  }
}

export class Int8ParseError extends Error {
  /**
   * @param {string} input
   * @param {string} reason
   */
  constructor(input, reason) {
    super(`Failed to parse "${input}" as Int8: ${reason}`);
    this.name = 'Int8ParseError';
  }
}
