/**
 * SNIP-12 Errors
 */

/**
 * Base error for SNIP-12 operations
 */
export class Snip12Error extends Error {
	override name = "Snip12Error";

	constructor(
		message: string,
		public readonly context?: Record<string, unknown>,
	) {
		super(message);
	}
}

/**
 * Type not found in type definitions
 */
export class Snip12TypeNotFoundError extends Snip12Error {
	override name = "Snip12TypeNotFoundError";

	constructor(typeName: string, availableTypes: string[]) {
		super(`Type '${typeName}' not found in type definitions`, {
			typeName,
			availableTypes,
		});
	}
}

/**
 * Invalid message data
 */
export class Snip12InvalidMessageError extends Snip12Error {
	override name = "Snip12InvalidMessageError";

	constructor(message: string, context?: Record<string, unknown>) {
		super(message, context);
	}
}

/**
 * Invalid domain
 */
export class Snip12InvalidDomainError extends Snip12Error {
	override name = "Snip12InvalidDomainError";

	constructor(message: string, context?: Record<string, unknown>) {
		super(message, context);
	}
}

/**
 * Encoding error
 */
export class Snip12EncodingError extends Snip12Error {
	override name = "Snip12EncodingError";

	constructor(message: string, context?: Record<string, unknown>) {
		super(message, context);
	}
}
