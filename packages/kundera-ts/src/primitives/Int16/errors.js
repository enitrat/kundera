import { MIN, MAX } from './constants.js';

export class Int16RangeError extends RangeError {
  /**
   * @param {bigint} value
   */
  constructor(value) {
    super(
      `Int16 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`
    );
    this.name = 'Int16RangeError';
  }
}

export class Int16ParseError extends Error {
  /**
   * @param {string} input
   * @param {string} reason
   */
  constructor(input, reason) {
    super(`Failed to parse "${input}" as Int16: ${reason}`);
    this.name = 'Int16ParseError';
  }
}
