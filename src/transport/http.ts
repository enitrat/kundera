/**
 * HTTP Transport
 *
 * JSON-RPC transport over HTTP with batching, retries, and configurable options.
 *
 * @module transport/http
 */

import {
  type Transport,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type TransportRequestOptions,
  JsonRpcErrorCode,
  createErrorResponse,
  matchBatchResponses,
} from './types.js';

// ============ HTTP Transport Options ============

/**
 * HTTP transport configuration
 */
export interface HttpTransportOptions {
  /** Enable automatic request batching */
  batch?: boolean | BatchOptions;
  /** Custom fetch options (headers, credentials, etc.) */
  fetchOptions?: RequestInit;
  /** Number of retries on failure (default: 0) */
  retries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

/**
 * Batch configuration options
 */
export interface BatchOptions {
  /** Wait time in ms to collect requests before sending batch (default: 0) */
  batchWait?: number;
  /** Maximum batch size (default: 100) */
  batchSize?: number;
}

// ============ Internal Types ============

interface PendingRequest {
  request: JsonRpcRequest;
  resolve: (response: JsonRpcResponse) => void;
  reject: (error: Error) => void;
  options?: TransportRequestOptions;
}

// ============ HTTP Transport Implementation ============

/**
 * Create an HTTP transport for JSON-RPC communication
 *
 * Features:
 * - Automatic batching with configurable wait time and size
 * - Retry with exponential backoff
 * - Request timeout
 * - Custom fetch options
 *
 * @example
 * ```ts
 * // Simple usage
 * const transport = httpTransport('https://starknet.example.com');
 *
 * // With batching
 * const transport = httpTransport('https://starknet.example.com', {
 *   batch: { batchWait: 10, batchSize: 50 },
 *   retries: 3,
 *   timeout: 30000
 * });
 * ```
 */
export function httpTransport(
  url: string,
  options: HttpTransportOptions = {},
): Transport {
  const {
    batch,
    fetchOptions = {},
    retries = 0,
    retryDelay = 1000,
    timeout = 30000,
  } = options;

  // Batching state
  const batchEnabled = !!batch;
  const batchConfig: BatchOptions =
    typeof batch === 'object' ? batch : { batchWait: 0, batchSize: 100 };
  const batchWait = batchConfig.batchWait ?? 0;
  const batchSize = batchConfig.batchSize ?? 100;

  let pendingBatch: PendingRequest[] = [];
  let batchTimeout: ReturnType<typeof setTimeout> | null = null;
  let requestIdCounter = 0;

  /**
   * Execute HTTP request with timeout
   */
  async function executeRequest(
    body: string,
    requestTimeout: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    // Combine external signal with timeout signal
    const combinedSignal = signal
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal;

    try {
      const response = await fetch(url, {
        method: 'POST',
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        body,
        signal: combinedSignal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Execute request with retries
   */
  async function executeWithRetry(
    body: string,
    opts: TransportRequestOptions = {},
  ): Promise<unknown> {
    const requestTimeout = opts.timeout ?? timeout;
    const maxRetries = opts.retries ?? retries;
    const delay = opts.retryDelay ?? retryDelay;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await executeRequest(body, requestTimeout, opts.signal);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort or if we've exhausted retries
        if (
          error instanceof Error &&
          error.name === 'AbortError' &&
          opts.signal?.aborted
        ) {
          throw error;
        }

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, attempt)),
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Flush pending batch
   */
  async function flushBatch(): Promise<void> {
    if (pendingBatch.length === 0) return;

    const batch = pendingBatch;
    pendingBatch = [];
    batchTimeout = null;

    const requests = batch.map((p) => p.request);
    const body = JSON.stringify(requests);

    try {
      const result = await executeWithRetry(body);
      const responses = result as JsonRpcResponse[];

      // Match responses to requests by id
      const matched = matchBatchResponses(requests, responses);

      // Resolve each pending request
      for (let i = 0; i < batch.length; i++) {
        const pending = batch[i]!;
        const response = matched[i];
        if (response) {
          pending.resolve(response);
        } else {
          const id = requests[i]?.id ?? null;
          pending.resolve(
            createErrorResponse(
              id,
              JsonRpcErrorCode.InternalError,
              'Missing response for batched request',
            ),
          );
        }
      }
    } catch (error) {
      // Reject all pending requests
      const errorResponse = createErrorResponse(
        null,
        JsonRpcErrorCode.InternalError,
        (error as Error).message,
      );
      for (const pending of batch) {
        pending.resolve(errorResponse);
      }
    }
  }

  /**
   * Queue request for batching
   */
  function queueRequest(
    request: JsonRpcRequest,
    options?: TransportRequestOptions,
  ): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      const pending: PendingRequest = { request, resolve, reject };
      if (options) {
        pending.options = options;
      }
      pendingBatch.push(pending);

      // Flush if batch size reached
      if (pendingBatch.length >= batchSize) {
        if (batchTimeout) {
          clearTimeout(batchTimeout);
          batchTimeout = null;
        }
        flushBatch();
        return;
      }

      // Schedule batch flush if not already scheduled
      if (!batchTimeout && batchWait > 0) {
        batchTimeout = setTimeout(() => flushBatch(), batchWait);
      } else if (batchWait === 0) {
        // Immediate flush on next tick for batchWait=0
        queueMicrotask(() => flushBatch());
      }
    });
  }

  return {
    type: 'http',

    async request<T>(
      request: JsonRpcRequest,
      options?: TransportRequestOptions,
    ): Promise<JsonRpcResponse<T>> {
      // Ensure request has an id
      const requestWithId: JsonRpcRequest = {
        ...request,
        id: request.id ?? ++requestIdCounter,
      };

      // Use batching if enabled
      if (batchEnabled) {
        return queueRequest(requestWithId, options) as Promise<JsonRpcResponse<T>>;
      }

      // Direct request
      const body = JSON.stringify(requestWithId);
      try {
        const result = await executeWithRetry(body, options);
        return result as JsonRpcResponse<T>;
      } catch (error) {
        return createErrorResponse(
          requestWithId.id ?? null,
          JsonRpcErrorCode.InternalError,
          (error as Error).message,
        ) as JsonRpcResponse<T>;
      }
    },

    async requestBatch<T>(
      requests: JsonRpcRequest[],
      options?: TransportRequestOptions,
    ): Promise<JsonRpcResponse<T>[]> {
      if (requests.length === 0) return [];

      // Ensure all requests have ids
      const requestsWithIds = requests.map((req, i) => ({
        ...req,
        id: req.id ?? ++requestIdCounter,
      }));

      const body = JSON.stringify(requestsWithIds);

      try {
        const result = await executeWithRetry(body, options);
        const responses = result as JsonRpcResponse<T>[];
        return matchBatchResponses(requestsWithIds, responses);
      } catch (error) {
        // Return error for all requests
        return requestsWithIds.map((req) =>
          createErrorResponse(
            req.id ?? null,
            JsonRpcErrorCode.InternalError,
            (error as Error).message,
          ) as JsonRpcResponse<T>,
        );
      }
    },
  };
}
