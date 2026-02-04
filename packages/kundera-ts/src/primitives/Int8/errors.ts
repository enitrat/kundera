import { MIN, MAX } from './constants.js';

export class Int8RangeError extends RangeError {
  constructor(value: bigint) {
    super(
      `Int8 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`
    );
    this.name = 'Int8RangeError';
  }
}

export class Int8ParseError extends Error {
  constructor(input: string, reason: string) {
    super(`Failed to parse "${input}" as Int8: ${reason}`);
    this.name = 'Int8ParseError';
  }
}
