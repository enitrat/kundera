/**
 * Batch Processing Utilities
 *
 * Utilities for batching and queueing async operations.
 *
 * @module utils/batch
 */

import type { BatchQueueOptions } from './types.js';

export class BatchQueue<T, R> {
  private readonly maxBatchSize: number;
  private readonly maxWaitTime: number;
  private readonly processBatch: (items: T[]) => Promise<R[]>;
  private readonly onError: ((error: unknown, items: T[]) => void) | undefined;

  private queue: Array<{
    item: T;
    resolve: (value: R) => void;
    reject: (error: unknown) => void;
  }> = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private processing = false;

  constructor(options: BatchQueueOptions<T, R>) {
    this.maxBatchSize = options.maxBatchSize;
    this.maxWaitTime = options.maxWaitTime;
    this.processBatch = options.processBatch;
    this.onError = options.onError;
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      if (this.queue.length === 1) {
        this.startTimer();
      }

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      }
    });
  }

  private startTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.maxWaitTime);
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0 || this.processing) {
      return;
    }

    const batch = this.queue.splice(0, this.maxBatchSize);
    const items = batch.map((entry) => entry.item);

    this.processing = true;

    try {
      const results = await this.processBatch(items);

      for (let i = 0; i < batch.length; i++) {
        batch[i]?.resolve(results[i]!);
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error, items);
      }

      for (const entry of batch) {
        entry.reject(error);
      }
    } finally {
      this.processing = false;

      if (this.queue.length > 0) {
        this.startTimer();

        if (this.queue.length >= this.maxBatchSize) {
          this.flush();
        }
      }
    }
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    for (const entry of this.queue) {
      entry.reject(new Error('Queue cleared'));
    }

    this.queue = [];
  }

  async drain(): Promise<void> {
    while (this.queue.length > 0 || this.processing) {
      await this.flush();
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

export function createBatchedFunction<T, R>(
  fn: (items: T[]) => Promise<R[]>,
  maxBatchSize: number,
  maxWaitTime: number,
): (item: T) => Promise<R> {
  const queue = new BatchQueue<T, R>({
    maxBatchSize,
    maxWaitTime,
    processBatch: fn,
  });

  return (item: T) => queue.add(item);
}

export class AsyncQueue<T, R> {
  private readonly processFn: (item: T) => Promise<R>;
  private readonly concurrency: number;
  private queue: Array<{
    item: T;
    resolve: (value: R) => void;
    reject: (error: unknown) => void;
  }> = [];
  private active = 0;

  constructor(processFn: (item: T) => Promise<R>, options: { concurrency: number }) {
    this.processFn = processFn;
    this.concurrency = options.concurrency;
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.active >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.active++;

    const entry = this.queue.shift();
    if (!entry) {
      this.active--;
      return;
    }

    try {
      const result = await this.processFn(entry.item);
      entry.resolve(result);
    } catch (error) {
      entry.reject(error);
    } finally {
      this.active--;
      this.process();
    }
  }

  size(): number {
    return this.queue.length;
  }

  activeCount(): number {
    return this.active;
  }

  async drain(): Promise<void> {
    while (this.queue.length > 0 || this.active > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}
