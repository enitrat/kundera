/**
 * Retry with Exponential Backoff
 *
 * Utility for retrying failed operations with exponential backoff and optional jitter.
 *
 * @module utils/retryWithBackoff
 */

import type { RetryOptions } from "./types.js";

const DEFAULT_RETRY_OPTIONS: Required<
	Omit<RetryOptions, "shouldRetry" | "onRetry">
> = {
	maxRetries: 3,
	initialDelay: 1000,
	factor: 2,
	maxDelay: 30000,
	jitter: true,
};

function calculateDelay(
	attempt: number,
	options: Required<Omit<RetryOptions, "shouldRetry" | "onRetry">>,
): number {
	const exponentialDelay = options.initialDelay * options.factor ** attempt;
	let delay = Math.min(exponentialDelay, options.maxDelay);

	if (options.jitter) {
		const jitterFactor = 0.8 + Math.random() * 0.4;
		delay = Math.floor(delay * jitterFactor);
	}

	return delay;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const config = {
		...DEFAULT_RETRY_OPTIONS,
		...options,
	};

	let lastError: unknown;

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			if (config.shouldRetry && !config.shouldRetry(error, attempt)) {
				throw error;
			}

			if (attempt >= config.maxRetries) {
				throw error;
			}

			const delay = calculateDelay(attempt, config);

			if (config.onRetry) {
				config.onRetry(error, attempt + 1, delay);
			}

			await sleep(delay);
		}
	}

	throw lastError;
}

export function withRetry<TArgs extends unknown[], TReturn>(
	fn: (...args: TArgs) => Promise<TReturn>,
	options: RetryOptions = {},
): (...args: TArgs) => Promise<TReturn> {
	return (...args: TArgs) => retryWithBackoff(() => fn(...args), options);
}
