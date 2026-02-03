/**
 * Starknet Transport Module
 *
 * Low-level JSON-RPC transports for HTTP, WebSocket, and fallback scenarios.
 * Transports handle communication; providers handle the API layer.
 *
 * @module transport
 */

// Types
export type {
  Transport,
  EventTransport,
  TransportConfig,
  TransportRequestOptions,
  TransportEvents,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  JsonRpcError,
} from './types.js';

export {
  JsonRpcErrorCode,
  isJsonRpcError,
  createRequest,
  createErrorResponse,
  matchBatchResponses,
} from './types.js';

// HTTP Transport
export { httpTransport, type HttpTransportOptions } from './http.js';

// WebSocket Transport
export {
  webSocketTransport,
  type WebSocketTransport,
  type WebSocketTransportOptions,
} from './websocket.js';
