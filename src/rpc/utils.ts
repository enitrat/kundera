/**
 * RPC Utilities
 *
 * Shared helpers for Starknet JSON-RPC calls.
 */

import {
  createRequest,
  isJsonRpcError,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from '../transport/types.js';
import type { BlockId } from './types.js';

let requestId = 0;

/**
 * Generate a unique JSON-RPC request id.
 */
export function nextRequestId(): number {
  requestId += 1;
  return requestId;
}

/**
 * Build a JSON-RPC request with an auto-incremented id.
 */
export function buildRequest(
  method: string,
  params?: unknown[],
  id?: number | string,
): JsonRpcRequest {
  return createRequest(method, params, id ?? nextRequestId());
}

/**
 * Format a block id for the RPC.
 */
export function formatBlockId(blockId: BlockId): BlockId {
  return blockId;
}

/**
 * Unwrap a JSON-RPC response, throwing on error.
 */
export function unwrapResponse<T>(response: JsonRpcResponse<T>): T {
  if (isJsonRpcError(response)) {
    const err = new Error(response.error.message) as Error & {
      code: number;
      data?: unknown;
    };
    err.code = response.error.code;
    err.data = response.error.data;
    throw err;
  }
  return response.result;
}
