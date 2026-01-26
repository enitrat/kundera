/**
 * Fallback Transport
 *
 * JSON-RPC transport that tries multiple transports in order,
 * with retry and optional ranking.
 *
 * @module transport/fallback
 */

import {
  type Transport,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type TransportRequestOptions,
  JsonRpcErrorCode,
  createErrorResponse,
  isJsonRpcError,
} from './types.js';

// ============ Fallback Transport Options ============

/**
 * Fallback transport configuration
 */
export interface FallbackTransportOptions {
  /** Number of retries per transport before trying next (default: 1) */
  retryCount?: number;
  /** Delay between retries in ms (default: 500) */
  retryDelay?: number;
  /**
   * Enable ranking - prioritize transports that succeed more often
   * (default: false)
   */
  rank?: boolean;
}

// ============ Internal Types ============

interface TransportStats {
  transport: Transport;
  successes: number;
  failures: number;
  lastFailure: number;
}

// ============ Fallback Transport Implementation ============

/**
 * Create a fallback transport that tries multiple transports in order
 *
 * Features:
 * - Tries transports in order until one succeeds
 * - Configurable retry count per transport
 * - Optional ranking to prioritize faster/more reliable transports
 *
 * @example
 * ```ts
 * const transport = fallbackTransport([
 *   httpTransport('https://primary.example.com'),
 *   httpTransport('https://backup.example.com'),
 * ], {
 *   retryCount: 2,
 *   rank: true
 * });
 * ```
 */
export function fallbackTransport(
  transports: Transport[],
  options: FallbackTransportOptions = {},
): Transport {
  if (transports.length === 0) {
    throw new Error('fallbackTransport requires at least one transport');
  }

  const { retryCount = 1, retryDelay = 500, rank = false } = options;

  // Track transport stats for ranking
  const stats: TransportStats[] = transports.map((transport) => ({
    transport,
    successes: 0,
    failures: 0,
    lastFailure: 0,
  }));

  /**
   * Get transports in priority order (for ranking)
   */
  function getOrderedTransports(): TransportStats[] {
    if (!rank) return stats;

    // Sort by success rate, with penalty for recent failures
    const now = Date.now();
    return [...stats].sort((a, b) => {
      const aTotal = a.successes + a.failures;
      const bTotal = b.successes + b.failures;

      // If no data, keep original order
      if (aTotal === 0 && bTotal === 0) return 0;
      if (aTotal === 0) return 1;
      if (bTotal === 0) return -1;

      const aRate = a.successes / aTotal;
      const bRate = b.successes / bTotal;

      // Apply penalty for recent failures (within last 30s)
      const aPenalty = now - a.lastFailure < 30000 ? 0.1 : 0;
      const bPenalty = now - b.lastFailure < 30000 ? 0.1 : 0;

      return bRate - bPenalty - (aRate - aPenalty);
    });
  }

  /**
   * Try request with a single transport
   */
  async function tryTransport<T>(
    stat: TransportStats,
    request: JsonRpcRequest,
    options?: TransportRequestOptions,
  ): Promise<{ success: boolean; response?: JsonRpcResponse<T> }> {
    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        const response = await stat.transport.request<T>(request, options);

        // Check if it's a transport-level error (not RPC error)
        if (
          isJsonRpcError(response) &&
          response.error.code === JsonRpcErrorCode.InternalError
        ) {
          // Transport error - retry
          stat.failures++;
          stat.lastFailure = Date.now();
          if (attempt < retryCount - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }

        // Success (including RPC errors, which are valid responses)
        stat.successes++;
        return { success: true, response };
      } catch (error) {
        stat.failures++;
        stat.lastFailure = Date.now();
        if (attempt < retryCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    return { success: false };
  }

  /**
   * Try batch request with a single transport
   */
  async function tryTransportBatch<T>(
    stat: TransportStats,
    requests: JsonRpcRequest[],
    options?: TransportRequestOptions,
  ): Promise<{ success: boolean; responses?: JsonRpcResponse<T>[] }> {
    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        const responses = await stat.transport.requestBatch<T>(requests, options);

        // Check if all responses are transport-level errors
        const allErrors = responses.every(
          (r) =>
            isJsonRpcError(r) && r.error.code === JsonRpcErrorCode.InternalError,
        );

        if (allErrors) {
          stat.failures++;
          stat.lastFailure = Date.now();
          if (attempt < retryCount - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }

        stat.successes++;
        return { success: true, responses };
      } catch (error) {
        stat.failures++;
        stat.lastFailure = Date.now();
        if (attempt < retryCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    return { success: false };
  }

  return {
    type: 'fallback',

    async request<T>(
      request: JsonRpcRequest,
      options?: TransportRequestOptions,
    ): Promise<JsonRpcResponse<T>> {
      const ordered = getOrderedTransports();
      const errors: string[] = [];

      for (const stat of ordered) {
        const result = await tryTransport<T>(stat, request, options);
        if (result.success && result.response) {
          return result.response;
        }
        errors.push(`${stat.transport.type}: failed after ${retryCount} attempts`);
      }

      return createErrorResponse(
        request.id ?? null,
        JsonRpcErrorCode.InternalError,
        `All transports failed: ${errors.join('; ')}`,
      ) as JsonRpcResponse<T>;
    },

    async requestBatch<T>(
      requests: JsonRpcRequest[],
      options?: TransportRequestOptions,
    ): Promise<JsonRpcResponse<T>[]> {
      if (requests.length === 0) return [];

      const ordered = getOrderedTransports();
      const errors: string[] = [];

      for (const stat of ordered) {
        const result = await tryTransportBatch<T>(stat, requests, options);
        if (result.success && result.responses) {
          return result.responses;
        }
        errors.push(`${stat.transport.type}: failed after ${retryCount} attempts`);
      }

      return requests.map((req) =>
        createErrorResponse(
          req.id ?? null,
          JsonRpcErrorCode.InternalError,
          `All transports failed: ${errors.join('; ')}`,
        ) as JsonRpcResponse<T>,
      );
    },

    close(): void {
      for (const stat of stats) {
        stat.transport.close?.();
      }
    },
  };
}
