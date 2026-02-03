import { Effect } from "effect";
import type {
  Transport,
  EventTransport,
  TransportConfig,
  TransportRequestOptions,
  TransportEvents,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  JsonRpcError
} from "@kundera-sn/kundera-ts/transport";
import {
  JsonRpcErrorCode,
  isJsonRpcError,
  createRequest,
  createErrorResponse,
  matchBatchResponses,
  httpTransport,
  type HttpTransportOptions,
  webSocketTransport,
  type WebSocketTransport,
  type WebSocketTransportOptions
} from "@kundera-sn/kundera-ts/transport";
import { TransportError } from "../errors.js";

const tryTransport = <T>(
  operation: string,
  input: unknown,
  expected: string | undefined,
  thunk: () => T
): Effect.Effect<T, TransportError> =>
  Effect.try({
    try: thunk,
    catch: (error) =>
      new TransportError({
        message: error instanceof Error ? error.message : "Transport operation failed",
        operation,
        input,
        expected,
        cause: error instanceof Error ? error : undefined
      })
  });

const tryTransportPromise = <T>(
  operation: string,
  input: unknown,
  expected: string | undefined,
  thunk: () => Promise<T>
): Effect.Effect<T, TransportError> =>
  Effect.tryPromise({
    try: thunk,
    catch: (error) =>
      new TransportError({
        message: error instanceof Error ? error.message : "Transport operation failed",
        operation,
        input,
        expected,
        cause: error instanceof Error ? error : undefined
      })
  });

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
  HttpTransportOptions,
  WebSocketTransport,
  WebSocketTransportOptions
};

export {
  JsonRpcErrorCode,
  isJsonRpcError,
  createRequest,
  createErrorResponse,
  matchBatchResponses,
  httpTransport,
  webSocketTransport
};

export { TransportError } from "../errors.js";

export const request = <T>(
  transport: Transport,
  request: JsonRpcRequest,
  options?: TransportRequestOptions
) =>
  tryTransportPromise(
    "request",
    { request, options },
    "transport.request",
    () => transport.request<T>(request, options)
  );

export const requestBatch = <T>(
  transport: Transport,
  requests: JsonRpcRequest[],
  options?: TransportRequestOptions
) =>
  tryTransportPromise(
    "requestBatch",
    { requests, options },
    "transport.requestBatch",
    () => transport.requestBatch<T>(requests, options)
  );

export const close = (transport: Transport) =>
  transport.close
    ? tryTransportPromise(
        "close",
        null,
        "transport.close",
        () => Promise.resolve(transport.close?.())
      )
    : Effect.succeed(undefined);

export const connect = (transport: WebSocketTransport) =>
  tryTransportPromise("connect", null, "transport.connect", () => transport.connect());

export const disconnect = (transport: WebSocketTransport) =>
  tryTransport("disconnect", null, "transport.close", () => transport.close());
