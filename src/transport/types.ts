/**
 * Transport Types
 *
 * JSON-RPC 2.0 compliant types and Transport interface for Starknet.
 *
 * @module transport/types
 */

// ============ JSON-RPC 2.0 Types ============

/**
 * JSON-RPC 2.0 request object
 */
export interface JsonRpcRequest {
  /** JSON-RPC version (always "2.0") */
  jsonrpc: '2.0';
  /** Request identifier (omit for notifications) */
  id?: number | string;
  /** Method name */
  method: string;
  /** Method parameters */
  params?: unknown[] | Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 success response
 */
export interface JsonRpcSuccessResponse<T = unknown> {
  /** JSON-RPC version */
  jsonrpc: '2.0';
  /** Request identifier (matches request) */
  id: number | string | null;
  /** Result data */
  result: T;
}

/**
 * JSON-RPC 2.0 error object
 */
export interface JsonRpcError {
  /** Error code */
  code: number;
  /** Human-readable error message */
  message: string;
  /** Optional error data */
  data?: unknown;
}

/**
 * JSON-RPC 2.0 error response
 */
export interface JsonRpcErrorResponse {
  /** JSON-RPC version */
  jsonrpc: '2.0';
  /** Request identifier (matches request, null for parse errors) */
  id: number | string | null;
  /** Error object */
  error: JsonRpcError;
}

/**
 * JSON-RPC 2.0 response (success or error)
 */
export type JsonRpcResponse<T = unknown> =
  | JsonRpcSuccessResponse<T>
  | JsonRpcErrorResponse;

/**
 * Check if response is an error response
 */
export function isJsonRpcError<T>(
  response: JsonRpcResponse<T>,
): response is JsonRpcErrorResponse {
  return 'error' in response;
}

// ============ Standard JSON-RPC Error Codes ============

export const JsonRpcErrorCode = {
  /** Parse error - Invalid JSON */
  ParseError: -32700,
  /** Invalid Request - JSON is not a valid Request object */
  InvalidRequest: -32600,
  /** Method not found */
  MethodNotFound: -32601,
  /** Invalid params */
  InvalidParams: -32602,
  /** Internal error */
  InternalError: -32603,
  /** Server error (reserved range: -32000 to -32099) */
  ServerError: -32000,
} as const;

// ============ Transport Interface ============

/**
 * Transport configuration options
 */
export interface TransportConfig {
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retries on failure (default: 0) */
  retries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
}

/**
 * Transport request options (per-request overrides)
 */
export interface TransportRequestOptions extends TransportConfig {
  /** Signal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Transport interface for JSON-RPC communication
 *
 * Transports handle the low-level communication (HTTP, WebSocket, etc.)
 * while providers handle the higher-level API and result mapping.
 *
 * Key responsibilities:
 * - Sending JSON-RPC requests
 * - Handling batching (if supported)
 * - Connection management
 * - Retry logic
 *
 * @example
 * ```ts
 * const transport = httpTransport('https://starknet.example.com');
 *
 * // Single request
 * const response = await transport.request({
 *   jsonrpc: '2.0',
 *   id: 1,
 *   method: 'starknet_blockNumber',
 *   params: []
 * });
 *
 * // Batch request (if supported)
 * const responses = await transport.requestBatch([
 *   { jsonrpc: '2.0', id: 1, method: 'starknet_blockNumber', params: [] },
 *   { jsonrpc: '2.0', id: 2, method: 'starknet_chainId', params: [] }
 * ]);
 * ```
 */
export interface Transport {
  /** Transport type identifier */
  readonly type: 'http' | 'websocket' | 'fallback' | 'custom';

  /**
   * Send a single JSON-RPC request
   *
   * @param request - JSON-RPC request object
   * @param options - Optional request configuration
   * @returns JSON-RPC response
   */
  request<T = unknown>(
    request: JsonRpcRequest,
    options?: TransportRequestOptions,
  ): Promise<JsonRpcResponse<T>>;

  /**
   * Send a batch of JSON-RPC requests
   *
   * Responses are matched to requests by id.
   * Order of responses may differ from request order (per JSON-RPC 2.0 spec).
   *
   * @param requests - Array of JSON-RPC requests
   * @param options - Optional request configuration
   * @returns Array of JSON-RPC responses (matched by id)
   */
  requestBatch<T = unknown>(
    requests: JsonRpcRequest[],
    options?: TransportRequestOptions,
  ): Promise<JsonRpcResponse<T>[]>;

  /**
   * Close the transport connection (if applicable)
   */
  close?(): void | Promise<void>;
}

// ============ Transport Events ============

/**
 * Transport event types
 *
 * @template TMessage - Type of message payload (default: unknown for raw transport)
 */
export interface TransportEvents<TMessage = unknown> {
  /** Connection established */
  connect: [];
  /** Connection closed */
  disconnect: [error?: Error];
  /** Error occurred */
  error: [error: Error];
  /** Message received (for subscriptions) */
  message: [data: TMessage];
}

/**
 * Transport with event emitter capabilities
 *
 * @template TMessage - Type of message payload (default: unknown for raw transport)
 */
export interface EventTransport<TMessage = unknown> extends Transport {
  /** Listen for transport events */
  on<E extends keyof TransportEvents<TMessage>>(
    event: E,
    listener: (...args: TransportEvents<TMessage>[E]) => void,
  ): this;

  /** Remove event listener */
  off<E extends keyof TransportEvents<TMessage>>(
    event: E,
    listener: (...args: TransportEvents<TMessage>[E]) => void,
  ): this;
}

// ============ Utility Types ============

/**
 * Create a JSON-RPC request object
 */
export function createRequest(
  method: string,
  params?: unknown[],
  id?: number | string,
): JsonRpcRequest {
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method,
  };
  if (id !== undefined) {
    request.id = id;
  }
  if (params !== undefined) {
    request.params = params;
  }
  return request;
}

/**
 * Create a JSON-RPC error response
 */
export function createErrorResponse(
  id: number | string | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcErrorResponse {
  const error: JsonRpcError = { code, message };
  if (data !== undefined) {
    error.data = data;
  }
  return {
    jsonrpc: '2.0',
    id,
    error,
  };
}

/**
 * Match batch responses to requests by id
 *
 * JSON-RPC 2.0 spec allows responses in any order for batch requests.
 * This function reorders responses to match request order.
 */
export function matchBatchResponses<T>(
  requests: JsonRpcRequest[],
  responses: JsonRpcResponse<T>[],
): JsonRpcResponse<T>[] {
  const responseMap = new Map<number | string | null, JsonRpcResponse<T>>();
  for (const response of responses) {
    responseMap.set(response.id, response);
  }

  return requests.map((request) => {
    const response = responseMap.get(request.id ?? null);
    if (!response) {
      // Request had no matching response (shouldn't happen with valid server)
      return createErrorResponse(
        request.id ?? null,
        JsonRpcErrorCode.InternalError,
        'No response for request',
      ) as JsonRpcResponse<T>;
    }
    return response;
  });
}
