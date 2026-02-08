import { Clock, Context, Effect, FiberRef, Layer, Ref } from "effect";
import * as Duration from "effect/Duration";
import * as Schedule from "effect/Schedule";
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
  readonly timeout?: Duration.DurationInput;
  readonly timeoutMs?: number;
  readonly retries?: number;
  readonly retryDelay?: Duration.DurationInput;
  readonly retryDelayMs?: number;
  readonly retrySchedule?: Schedule.Schedule<unknown, TransportError>;
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

const timeoutRef = FiberRef.unsafeMake<Duration.Duration | undefined>(undefined);
const retriesRef = FiberRef.unsafeMake<number | undefined>(undefined);
const retryDelayRef = FiberRef.unsafeMake<Duration.Duration | undefined>(
  undefined,
);
const retryScheduleRef = FiberRef.unsafeMake<
  Schedule.Schedule<unknown, TransportError> | undefined
>(undefined);
const tracingRef = FiberRef.unsafeMake<boolean>(false);
const requestInterceptorRef = FiberRef.unsafeMake<RequestInterceptor>((context) =>
  Effect.succeed(context),
);
const responseInterceptorRef = FiberRef.unsafeMake<ResponseInterceptor>(
  <T>(context: TransportResponseContext<T>) => Effect.succeed(context),
);
const errorInterceptorRef = FiberRef.unsafeMake<ErrorInterceptor>(() => Effect.void);

export const withTimeout =
  (timeout: Duration.DurationInput) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, timeoutRef, Duration.decode(timeout));

export const withRetries =
  (retries: number) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, retriesRef, retries);

export const withRetryDelay =
  (retryDelay: Duration.DurationInput) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, retryDelayRef, Duration.decode(retryDelay));

export const withRetrySchedule =
  (retrySchedule: Schedule.Schedule<unknown, TransportError>) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.locally(effect, retryScheduleRef, retrySchedule);

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
  options: {
    readonly retries: number;
    readonly retryDelay: Duration.Duration;
    readonly retrySchedule?: Schedule.Schedule<unknown, TransportError>;
  },
): Effect.Effect<T, TransportError> => {
  const base = Effect.tryPromise({
    try: execute,
    catch: (cause) =>
      new TransportError({
        operation,
        message: "Transport request failed",
        cause,
      }),
  });

  if (options.retrySchedule) {
    return base.pipe(Effect.retry(options.retrySchedule));
  }

  if (options.retries <= 0) {
    return base;
  }

  return base.pipe(
    Effect.retry(
      Schedule.recurs(options.retries).pipe(
        Schedule.addDelay(() => options.retryDelay),
      ),
    ),
  );
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
        const startedAt = yield* Clock.currentTimeMillis;
        const fiberTimeout = yield* FiberRef.get(timeoutRef);
        const fiberRetries = yield* FiberRef.get(retriesRef);
        const fiberRetryDelay = yield* FiberRef.get(retryDelayRef);
        const fiberRetrySchedule = yield* FiberRef.get(retryScheduleRef);
        const tracingEnabled = yield* FiberRef.get(tracingRef);
        const requestInterceptor = yield* FiberRef.get(requestInterceptorRef);
        const responseInterceptor = yield* FiberRef.get(responseInterceptorRef);
        const errorInterceptor = yield* FiberRef.get(errorInterceptorRef);

        const requestContext = yield* requestInterceptor({
          request,
          options,
        });

        const timeoutDuration =
          requestContext.options?.timeout !== undefined
            ? Duration.decode(requestContext.options.timeout)
            : requestContext.options?.timeoutMs !== undefined
              ? Duration.millis(requestContext.options.timeoutMs)
              : fiberTimeout;

        const retries = Math.max(requestContext.options?.retries ?? fiberRetries ?? 0, 0);
        const retryDelay = requestContext.options?.retryDelay !== undefined
          ? Duration.decode(requestContext.options.retryDelay)
          : requestContext.options?.retryDelayMs !== undefined
            ? Duration.millis(requestContext.options.retryDelayMs)
            : (fiberRetryDelay ?? Duration.millis(0));
        const retrySchedule = requestContext.options?.retrySchedule ?? fiberRetrySchedule;

        const timeoutMs =
          timeoutDuration === undefined ? undefined : Duration.toMillis(timeoutDuration);
        const retryDelayMs = Duration.toMillis(retryDelay);

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
          {
            retries,
            retryDelay,
            retrySchedule,
          },
        ).pipe(
          Effect.catchTag("TransportError", (error) =>
            Effect.flatMap(Clock.currentTimeMillis, (now) =>
              errorInterceptor({
                request: requestContext.request,
                error,
                durationMs: Number(now - startedAt),
              }).pipe(Effect.zipRight(Effect.fail(error))),
            ),
          ),
        );

        const responseTime = yield* Clock.currentTimeMillis;
        const interceptedResponse = yield* responseInterceptor({
          request: requestContext.request,
          response,
          durationMs: Number(responseTime - startedAt),
        });

        if (tracingEnabled) {
          const endTime = yield* Clock.currentTimeMillis;
          yield* Effect.logDebug("transport.request.end", {
            method: requestContext.request.method,
            durationMs: Number(endTime - startedAt),
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

        // Trust boundary: we assume the selected JSON-RPC node returns a value
        // that matches the caller's requested generic result type.
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
