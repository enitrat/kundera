/**
 * Polling Utilities
 *
 * Utilities for polling operations with configurable intervals, backoff, and timeouts.
 *
 * @module utils/poll
 */

import type { PollOptions } from './types.js';

const DEFAULT_POLL_OPTIONS: Required<Omit<PollOptions<unknown>, 'validate' | 'onPoll'>> = {
  interval: 1000,
  timeout: 60000,
  backoff: false,
  backoffFactor: 1.5,
  maxInterval: 10000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function poll<T>(fn: () => Promise<T>, options: PollOptions<T> = {}): Promise<T> {
  const config = {
    ...DEFAULT_POLL_OPTIONS,
    ...options,
  };

  const startTime = Date.now();
  let attempt = 0;
  let currentInterval = config.interval;

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= config.timeout) {
      throw new Error(`Polling timeout after ${config.timeout}ms`);
    }

    try {
      const result = await fn();

      if (config.onPoll) {
        config.onPoll(result, attempt);
      }

      const isValid = config.validate ? config.validate(result) : !!result;

      if (isValid) {
        return result;
      }
    } catch (_error) {
      // continue polling
    }

    const remainingTime = config.timeout - (Date.now() - startTime);
    const waitTime = Math.min(currentInterval, remainingTime);

    if (waitTime > 0) {
      await sleep(waitTime);
    }

    if (config.backoff) {
      currentInterval = Math.min(
        currentInterval * config.backoffFactor,
        config.maxInterval,
      );
    }

    attempt++;
  }
}

export async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (result: T) => boolean,
  options: Omit<PollOptions<T>, 'validate'> = {},
): Promise<T> {
  return poll(fn, {
    ...options,
    validate: predicate,
  });
}

export async function pollForReceipt<TReceipt>(
  txHash: string,
  getReceipt: (hash: string) => Promise<TReceipt | null>,
  options: Omit<PollOptions<TReceipt | null>, 'validate'> = {},
): Promise<TReceipt> {
  const receipt = await poll(() => getReceipt(txHash), {
    interval: 1000,
    timeout: 60000,
    ...options,
    validate: (r) => r !== null,
  });

  return receipt as TReceipt;
}

export async function pollWithBackoff<T>(
  fn: () => Promise<T>,
  options: PollOptions<T> = {},
): Promise<T> {
  return poll(fn, {
    ...options,
    backoff: true,
  });
}
