import { MAX, MIN } from "./constants.js";

export class Int32RangeError extends RangeError {
	/**
	 * @param {bigint} value
	 */
	constructor(value) {
		super(
			`Int32 value ${value} is out of range. Must be between ${MIN} and ${MAX}.`,
		);
		this.name = "Int32RangeError";
	}
}

export class Int32ParseError extends Error {
	/**
	 * @param {string} input
	 * @param {string} reason
	 */
	constructor(input, reason) {
		super(`Failed to parse "${input}" as Int32: ${reason}`);
		this.name = "Int32ParseError";
	}
}
