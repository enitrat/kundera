/**
 * Error thrown when Uint256 value is negative
 */
export class Uint256NegativeError extends Error {
	/**
	 * @param {bigint} value
	 */
	constructor(value) {
		super(`Uint256 value cannot be negative: ${value}`);
		this.name = "Uint256NegativeError";
	}
}

/**
 * Error thrown when Uint256 value exceeds maximum
 */
export class Uint256OverflowError extends Error {
	/**
	 * @param {bigint} value
	 */
	constructor(value) {
		super(`Uint256 value exceeds maximum: ${value}`);
		this.name = "Uint256OverflowError";
	}
}

/**
 * Error thrown when number is not an integer
 */
export class Uint256NotIntegerError extends Error {
	/**
	 * @param {number} value
	 */
	constructor(value) {
		super(`Uint256 value must be an integer: ${value}`);
		this.name = "Uint256NotIntegerError";
	}
}
