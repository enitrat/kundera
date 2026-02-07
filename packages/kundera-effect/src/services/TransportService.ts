import { Context, Effect, FiberRef, Layer, Ref } from "effect";
import {
  createRequest,
  httpTransport,
  isJsonRpcError,
  webSocketTransport,
  type HttpTransportOptions,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type Transport,
  type WebSocketTransportOptions,
} from "@kundera-sn/kundera-ts/transport";

import { RpcError, TransportError } from "../errors.js";

export interface RequestOptions {
  readonly timeoutMs?: number;
  readonly retries?: number;
  readonly retryDelayMs?: number;
}

export interface TransportRequestContext {
  readonly request: JsonRpcRequest;
  readonly options?: RequestOptions;
}

export interface TransportResponseContext<T> {
  readonly request: JsonRpcRequest;
  readonly response: JsonRpcResponse<T>;
  readonly durationMs: number;
}

export interface TransportErrorContext {
  readonly request: JsonRpcRequest;
  readonly error: TransportError;
  readonly durationMs: number;
}

export type RequestInterceptor = (
  context: TransportRequestContext,
) => Effect.Effect<TransportRequestContext>;

export type ResponseInterceptor = <T>(
  context: TransportResponseContext<T>,
) => Effect.Effect<TransportResponseContext<T>>;

export type ErrorInterceptor = (
  context: TransportErrorContext,
) => Effect.Effect<void>;

export interface TransportServiceShape {
  readonly requestRaw: <T>(
    request: JsonRpcRequest,
    options?: RequestOptions,
  ) => Effect.Effect<JsonRpcResponse<T>, TransportError>;

  readonly request: <T>(
    method: string,
    params?: readonly unknown[],
    options?: RequestOptions,
  ) => Effect.Effect<T, TransportError | RpcError>;

  readonly close: Effect.Effect<void>;
}

export class TransportService extends Context.Tag("@kundera/TransportService")<
  TransportService,
  TransportServiceShape
>() {}

const timeoutRef = FiberRef.unsafeMake<number | undefined>(undefined);
const retriesRef = FiberRef.unsafeMake<number | undefined>(undefined);
const retryDelayRef = FiberRef.unsafeMake<number | undefined>(undefined);
const tracingRef = FiberRef.unsafeMake<boolean>(false);
const requestInterceptorRef = FiberRef.unsafeMake<RequestInterceptor>((context) =>
  Effect.succeed(context),
);
const responseInterceptorRef = FiberRef.unsafeMake<ResponseInterceptor>(
  <T>(context: TransportResponseContext<T>) => Effect.succeed(context),
);
const errorInterceptorRef = FiberRef.unsafeMake<ErrorInterceptor>(() => Effect.void);

export const withTimeout =
  (timeoutMs: number) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, timeoutRef, timeoutMs);

export const withRetries =
  (retries: number) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, retriesRef, retries);

export const withRetryDelay =
  (retryDelayMs: number) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, retryDelayRef, retryDelayMs);

export const withTracing =
  (enabled = true) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, tracingRef, enabled);

export const withRequestInterceptor =
  (interceptor: RequestInterceptor) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, requestInterceptorRef, interceptor);

export const withResponseInterceptor =
  (interceptor: ResponseInterceptor) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, responseInterceptorRef, interceptor);

export const withErrorInterceptor =
  (interceptor: ErrorInterceptor) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, errorInterceptorRef, interceptor);

export const withInterceptors =
  (options: {
    readonly onRequest?: RequestInterceptor;
    readonly onResponse?: ResponseInterceptor;
    readonly onError?: ErrorInterceptor;
  }) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> => {
    let next = effect;
    if (options.onRequest) {
      next = Effect.locally(next, requestInterceptorRef, options.onRequest);
    }
    if (options.onResponse) {
      next = Effect.locally(next, responseInterceptorRef, options.onResponse);
    }
    if (options.onError) {
      next = Effect.locally(next, errorInterceptorRef, options.onError);
    }
    return next;
  };

const attemptRequest = <T>(
  operation: string,
  execute: () => Promise<T>,
  retries: number,
  retryDelayMs: number,
): Effect.Effect<T, TransportError> => {
  const loop = (remaining: number): Effect.Effect<T, TransportError> =>
    Effect.tryPromise({
      try: execute,
      catch: (cause) =>
        new TransportError({
          operation,
          message: "Transport request failed",
          cause,
        }),
    }).pipe(
      Effect.catchTag("TransportError", (error) => {
        if (remaining <= 0) {
          return Effect.fail(error);
        }

        return Effect.sleep(`${retryDelayMs} millis`).pipe(
          Effect.zipRight(loop(remaining - 1)),
        );
      }),
    );

  return loop(retries);
};

const makeTransportService = (
  transport: Transport,
): Effect.Effect<TransportServiceShape> =>
  Effect.gen(function* () {
    const requestIdRef = yield* Ref.make(0);

    const nextRequestId = Ref.updateAndGet(requestIdRef, (n) => n + 1);

    const requestRaw = <T>(
      request: JsonRpcRequest,
      options?: RequestOptions,
    ): Effect.Effect<JsonRpcResponse<T>, TransportError> =>
      Effect.gen(function* () {
        const startedAt = Date.now();
        const fiberTimeout = yield* FiberRef.get(timeoutRef);
        const fiberRetries = yield* FiberRef.get(retriesRef);
        const fiberRetryDelay = yield* FiberRef.get(retryDelayRef);
        const tracingEnabled = yield* FiberRef.get(tracingRef);
        const requestInterceptor = yield* FiberRef.get(requestInterceptorRef);
        const responseInterceptor = yield* FiberRef.get(responseInterceptorRef);
        const errorInterceptor = yield* FiberRef.get(errorInterceptorRef);

        const requestContext = yield* requestInterceptor({
          request,
          options,
        });

        const timeoutMs = requestContext.options?.timeoutMs ?? fiberTimeout;
        const retries = Math.max(requestContext.options?.retries ?? fiberRetries ?? 0, 0);
        const retryDelayMs = Math.max(
          requestContext.options?.retryDelayMs ?? fiberRetryDelay ?? 0,
          0,
        );

        if (tracingEnabled) {
          yield* Effect.logDebug("transport.request.start", {
            method: requestContext.request.method,
            hasParams: requestContext.request.params !== undefined,
            timeoutMs,
            retries,
            retryDelayMs,
          });
        }

        const response = yield* attemptRequest(
          `requestRaw:${requestContext.request.method}`,
          () =>
            transport.request<T>(
              requestContext.request,
              timeoutMs ? { timeout: timeoutMs } : undefined,
            ),
          retries,
          retryDelayMs,
        ).pipe(
          Effect.catchTag("TransportError", (error) =>
            errorInterceptor({
              request: requestContext.request,
              error,
              durationMs: Date.now() - startedAt,
            }).pipe(Effect.zipRight(Effect.fail(error))),
          ),
        );

        const interceptedResponse = yield* responseInterceptor({
          request: requestContext.request,
          response,
          durationMs: Date.now() - startedAt,
        });

        if (tracingEnabled) {
          yield* Effect.logDebug("transport.request.end", {
            method: requestContext.request.method,
            durationMs: Date.now() - startedAt,
          });
        }

        return interceptedResponse.response;
      });

    const request = <T>(
      method: string,
      params?: readonly unknown[],
      options?: RequestOptions,
    ): Effect.Effect<T, TransportError | RpcError> =>
      Effect.gen(function* () {
        const id = yield* nextRequestId;
        const payload = createRequest(method, params ? [...params] : undefined, id);
        const response = yield* requestRaw<T>(payload, options);

        if (isJsonRpcError(response)) {
          return yield* Effect.fail(
            new RpcError({
              method,
              code: response.error.code,
              message: response.error.message,
              data: response.error.data,
            }),
          );
        }

        return response.result as T;
      });

    const close: TransportServiceShape["close"] =
      typeof transport.close === "function"
        ? Effect.tryPromise({
            try: () => Promise.resolve(transport.close?.()),
            catch: (cause) =>
              new TransportError({
                operation: "close",
                message: "Failed to close transport",
                cause,
              }),
          }).pipe(Effect.orDie)
        : Effect.void;

    return {
      requestRaw,
      request,
      close,
    };
  });

export const TransportLive = (
  transport: Transport,
): Layer.Layer<TransportService> =>
  Layer.effect(TransportService, makeTransportService(transport));

export const HttpTransportLive = (
  url: string,
  options?: HttpTransportOptions,
): Layer.Layer<TransportService> => TransportLive(httpTransport(url, options));

export const WebSocketTransportLive = (
  url: string,
  options?: WebSocketTransportOptions,
): Layer.Layer<TransportService, TransportError> =>
  Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      const transport = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: async () => {
            const ws = webSocketTransport(url, options);
            await ws.connect();
            return ws as unknown as Transport;
          },
          catch: (cause) =>
            new TransportError({
              operation: "websocket.connect",
              message: "Failed to connect websocket transport",
              cause,
            }),
        }),
        (ws) =>
          Effect.tryPromise({
            try: () => Promise.resolve(ws.close?.()),
            catch: () => undefined,
          }).pipe(Effect.orDie),
      );

      return yield* makeTransportService(transport);
    }),
  );
