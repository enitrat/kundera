import { MIN, MAX } from './constants.js';

export class Int32RangeError extends RangeError {
  constructor(value: bigint) {
    super(
      `Int32 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`
    );
    this.name = 'Int32RangeError';
  }
}

export class Int32ParseError extends Error {
  constructor(input: string, reason: string) {
    super(`Failed to parse "${input}" as Int32: ${reason}`);
    this.name = 'Int32ParseError';
  }
}
