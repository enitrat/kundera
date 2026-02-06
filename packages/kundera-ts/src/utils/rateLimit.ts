/**
 * Rate Limiting Utilities
 *
 * Utilities for rate limiting, throttling, and debouncing function calls.
 *
 * @module utils/rateLimit
 */

import type { RateLimiterOptions } from "./types.js";

export function throttle<TArgs extends unknown[], TReturn>(
	fn: (...args: TArgs) => TReturn,
	wait: number,
): (...args: TArgs) => TReturn | undefined {
	let lastCallTime = 0;
	let lastResult: TReturn | undefined;

	return (...args: TArgs): TReturn | undefined => {
		const now = Date.now();
		const timeSinceLastCall = now - lastCallTime;

		if (timeSinceLastCall >= wait) {
			lastCallTime = now;
			lastResult = fn(...args);
			return lastResult;
		}

		return lastResult;
	};
}

export function debounce<TArgs extends unknown[], TReturn>(
	fn: (...args: TArgs) => TReturn,
	wait: number,
): ((...args: TArgs) => void) & { cancel: () => void } {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const debounced = (...args: TArgs): void => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			fn(...args);
			timeoutId = undefined;
		}, wait);
	};

	debounced.cancel = () => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}
	};

	return debounced;
}

export class RateLimiter {
	private readonly maxRequests: number;
	private readonly interval: number;
	private readonly strategy: "queue" | "reject" | "drop";
	private tokens: number;
	private lastRefill: number;
	private queue: Array<{
		fn: () => Promise<unknown>;
		resolve: (value: unknown) => void;
		reject: (error: unknown) => void;
	}> = [];
	private processing = false;

	constructor(options: RateLimiterOptions) {
		this.maxRequests = options.maxRequests;
		this.interval = options.interval;
		this.strategy = options.strategy ?? "queue";
		this.tokens = options.maxRequests;
		this.lastRefill = Date.now();
	}

	private refill(): void {
		const now = Date.now();
		const elapsed = now - this.lastRefill;
		const tokensToAdd = (elapsed / this.interval) * this.maxRequests;

		if (tokensToAdd >= 1) {
			this.tokens = Math.min(
				this.maxRequests,
				this.tokens + Math.floor(tokensToAdd),
			);
			this.lastRefill = now;
		}
	}

	private async processQueue(): Promise<void> {
		if (this.processing || this.queue.length === 0) {
			return;
		}

		this.processing = true;

		while (this.queue.length > 0) {
			this.refill();

			if (this.tokens < 1) {
				const waitTime = this.interval / this.maxRequests;
				await new Promise((resolve) => setTimeout(resolve, waitTime));
				continue;
			}

			const item = this.queue.shift();
			if (!item) break;

			this.tokens--;

			try {
				const result = await item.fn();
				item.resolve(result);
			} catch (error) {
				item.reject(error);
			}
		}

		this.processing = false;
	}

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		this.refill();

		if (this.tokens >= 1) {
			this.tokens--;
			const result = await fn();

			if (this.queue.length > 0) {
				this.processQueue();
			}

			return result;
		}

		switch (this.strategy) {
			case "queue":
				return new Promise<T>((resolve, reject) => {
					this.queue.push({
						fn: fn as () => Promise<unknown>,
						resolve: resolve as (value: unknown) => void,
						reject,
					});
					this.processQueue();
				});

			case "reject":
				throw new Error(
					`Rate limit exceeded: ${this.maxRequests} requests per ${this.interval}ms`,
				);

			case "drop":
				return Promise.resolve(undefined as T);
		}
	}

	wrap<TArgs extends unknown[], TReturn>(
		fn: (...args: TArgs) => Promise<TReturn>,
	): (...args: TArgs) => Promise<TReturn> {
		return (...args: TArgs) => this.execute(() => fn(...args));
	}

	getTokens(): number {
		this.refill();
		return this.tokens;
	}

	getQueueLength(): number {
		return this.queue.length;
	}

	clearQueue(): void {
		this.queue = [];
	}
}
