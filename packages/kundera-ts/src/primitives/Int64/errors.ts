import { MIN, MAX } from './constants.js';

export class Int64RangeError extends RangeError {
  constructor(value: bigint) {
    super(
      `Int64 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`
    );
    this.name = 'Int64RangeError';
  }
}

export class Int64ParseError extends Error {
  constructor(input: string, reason: string) {
    super(`Failed to parse "${input}" as Int64: ${reason}`);
    this.name = 'Int64ParseError';
  }
}
