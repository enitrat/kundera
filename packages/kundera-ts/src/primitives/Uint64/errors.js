/**
 * Error thrown when Uint64 value is negative
 */
export class Uint64NegativeError extends Error {
	/**
	 * @param {bigint | number} value
	 */
	constructor(value) {
		super(`Uint64 value cannot be negative: ${value}`);
		this.name = "Uint64NegativeError";
	}
}

/**
 * Error thrown when Uint64 value exceeds maximum (2^64 - 1)
 */
export class Uint64OverflowError extends Error {
	/**
	 * @param {bigint | number} value
	 */
	constructor(value) {
		super(`Uint64 value exceeds maximum (2^64 - 1): ${value}`);
		this.name = "Uint64OverflowError";
	}
}

/**
 * Error thrown when Uint64 value is not an integer
 */
export class Uint64NotIntegerError extends Error {
	/**
	 * @param {number} value
	 */
	constructor(value) {
		super(`Uint64 value must be an integer: ${value}`);
		this.name = "Uint64NotIntegerError";
	}
}
