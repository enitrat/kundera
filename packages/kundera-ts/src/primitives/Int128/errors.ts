import { MIN, MAX } from './constants.js';

export class Int128RangeError extends RangeError {
  constructor(value: bigint) {
    super(
      `Int128 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`
    );
    this.name = 'Int128RangeError';
  }
}

export class Int128ParseError extends Error {
  constructor(input: string, reason: string) {
    super(`Failed to parse "${input}" as Int128: ${reason}`);
    this.name = 'Int128ParseError';
  }
}
