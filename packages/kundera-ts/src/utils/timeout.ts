/**
 * Timeout Utilities
 *
 * Utilities for adding timeouts to promises and operations.
 *
 * @module utils/timeout
 */

import type { TimeoutOptions } from './types.js';

export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions,
): Promise<T> {
  const { ms, message = 'Operation timed out', signal } = options;

  if (signal?.aborted) {
    throw new Error('Operation aborted');
  }

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(message));
      }, ms);

      promise.finally(() => clearTimeout(timeoutId));

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Operation aborted'));
        });
      }
    }),
  ]);
}

export function wrapWithTimeout<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  ms: number,
  message?: string,
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => {
    const options: TimeoutOptions = { ms };
    if (message !== undefined) {
      options.message = message;
    }
    return withTimeout(fn(...args), options);
  };
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Operation aborted'));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Operation aborted'));
      });
    }
  });
}

export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  maxRetries = 0,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn(), { ms: timeoutMs });
    } catch (error) {
      lastError = error;

      if (!(error instanceof TimeoutError) || attempt >= maxRetries) {
        throw error;
      }

      await sleep(100);
    }
  }

  throw lastError;
}
