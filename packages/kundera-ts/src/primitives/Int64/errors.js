import { MAX, MIN } from "./constants.js";

export class Int64RangeError extends RangeError {
	/**
	 * @param {bigint} value
	 */
	constructor(value) {
		super(
			`Int64 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`,
		);
		this.name = "Int64RangeError";
	}
}

export class Int64ParseError extends Error {
	/**
	 * @param {string} input
	 * @param {string} reason
	 */
	constructor(input, reason) {
		super(`Failed to parse "${input}" as Int64: ${reason}`);
		this.name = "Int64ParseError";
	}
}
