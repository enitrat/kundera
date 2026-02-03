/**
 * Transport service definition for Starknet JSON-RPC communication.
 */

import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  Transport,
  TransportRequestOptions
} from "kundera-sn/transport";
import { isJsonRpcError, matchBatchResponses } from "kundera-sn/transport";
import { RpcError, TransportError } from "../../errors.js";

export type RpcRequest = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

export type TransportShape = {
  requestRaw: <T>(
    request: JsonRpcRequest,
    options?: TransportRequestOptions
  ) => Effect.Effect<JsonRpcResponse<T>, TransportError>;
  requestBatchRaw: <T>(
    requests: JsonRpcRequest[],
    options?: TransportRequestOptions
  ) => Effect.Effect<JsonRpcResponse<T>[], TransportError>;
  request: <T>(
    method: string,
    params?: unknown[] | Record<string, unknown>,
    options?: TransportRequestOptions
  ) => Effect.Effect<T, TransportError | RpcError>;
  requestBatch: <T>(
    requests: RpcRequest[],
    options?: TransportRequestOptions
  ) => Effect.Effect<T[], TransportError | RpcError>;
  close: () => Effect.Effect<void, TransportError>;
};

export class TransportService extends Context.Tag("TransportService")<
  TransportService,
  TransportShape
>() {}

export type RetryConfig = {
  maxRetries: number;
  delayMs?: number;
  backoffFactor?: number;
};

export type RateLimitConfig = {
  maxRequests: number;
  intervalMs: number;
};

export type TransportConfig = {
  timeoutMs?: number;
  retry?: RetryConfig;
  rateLimit?: RateLimitConfig;
};

const toTransportError = (operation: string, input: unknown, error: unknown) =>
  new TransportError({
    message: error instanceof Error ? error.message : "Transport operation failed",
    operation,
    input,
    expected: "JSON-RPC response",
    cause: error instanceof Error ? error : undefined
  });

const toRpcError = (operation: string, input: unknown, error: { code: number; message: string; data?: unknown }) =>
  new RpcError({
    message: error.message,
    operation,
    input,
    expected: "JSON-RPC success response",
    cause: error
  });

const buildRequest = (
  method: string,
  params?: unknown[] | Record<string, unknown>,
  id?: number | string
): JsonRpcRequest => {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    method
  };
  if (id !== undefined) {
    request.id = id;
  }
  if (params !== undefined) {
    request.params = params;
  }
  return request;
};

const createRateLimiter = (config?: RateLimitConfig) => {
  if (!config) {
    return () => Effect.void;
  }

  let timestamps: number[] = [];

  return () =>
    Effect.gen(function* () {
      const now = Date.now();
      timestamps = timestamps.filter((t) => now - t < config.intervalMs);

      if (timestamps.length < config.maxRequests) {
        timestamps.push(now);
        return;
      }

      const oldest = timestamps[0] ?? now;
      const waitMs = Math.max(0, config.intervalMs - (now - oldest));
      yield* Effect.sleep(Duration.millis(waitMs));
      timestamps = timestamps.filter((t) => Date.now() - t < config.intervalMs);
      timestamps.push(Date.now());
    });
};

const withRetry = <A>(
  effect: Effect.Effect<A, TransportError>,
  config?: RetryConfig
) => {
  if (!config || config.maxRetries <= 0) {
    return effect;
  }

  const maxRetries = config.maxRetries;
  let delay = config.delayMs ?? 250;
  const factor = config.backoffFactor ?? 2;

  return Effect.gen(function* () {
    let attempt = 0;
    while (true) {
      const result = yield* Effect.either(effect);
      if (Either.isRight(result)) {
        return result.right;
      }
      if (attempt >= maxRetries) {
        return yield* Effect.fail(result.left);
      }
      yield* Effect.sleep(Duration.millis(delay));
      delay *= factor;
      attempt += 1;
    }
  });
};

const withTimeout = <A>(
  effect: Effect.Effect<A, TransportError>,
  timeoutMs: number | undefined,
  operation: string,
  input: unknown
) => {
  if (!timeoutMs) {
    return effect;
  }

  return effect.pipe(
    Effect.timeoutFail({
      duration: Duration.millis(timeoutMs),
      onTimeout: () =>
        toTransportError(operation, input, new Error(`Timeout after ${timeoutMs}ms`))
    })
  );
};

export const makeTransportService = (
  transport: Transport,
  config?: TransportConfig
): TransportShape => {
  let requestId = 0;
  const nextId = () => ++requestId;
  const rateLimit = createRateLimiter(config?.rateLimit);

  const requestRaw = <T>(request: JsonRpcRequest, options?: TransportRequestOptions) =>
    rateLimit().pipe(
      Effect.zipRight(
        withRetry(
          withTimeout(
            Effect.tryPromise({
              try: () => transport.request<T>(request, options),
              catch: (error) =>
                toTransportError("transport.request", { request, options }, error)
            }),
            config?.timeoutMs,
            "transport.request",
            { request, options }
          ),
          config?.retry
        )
      )
    );

  const requestBatchRaw = <T>(requests: JsonRpcRequest[], options?: TransportRequestOptions) =>
    rateLimit().pipe(
      Effect.zipRight(
        withRetry(
          withTimeout(
            Effect.tryPromise({
              try: () => transport.requestBatch<T>(requests, options),
              catch: (error) =>
                toTransportError("transport.requestBatch", { requests, options }, error)
            }),
            config?.timeoutMs,
            "transport.requestBatch",
            { requests, options }
          ),
          config?.retry
        )
      )
    );

  const request = <T>(
    method: string,
    params?: unknown[] | Record<string, unknown>,
    options?: TransportRequestOptions
  ) =>
    requestRaw<T>(buildRequest(method, params, nextId()), options).pipe(
      Effect.flatMap((response) => {
        if (isJsonRpcError(response)) {
          return Effect.fail(toRpcError(method, params ?? [], response.error));
        }
        return Effect.succeed(response.result);
      })
    );

  const requestBatch = <T>(requests: RpcRequest[], options?: TransportRequestOptions) => {
    const withIds = requests.map((req) => buildRequest(req.method, req.params, nextId()));
    return requestBatchRaw<T>(withIds, options).pipe(
      Effect.map((responses) => matchBatchResponses(withIds, responses)),
      Effect.flatMap((responses) => {
        for (const response of responses) {
          if (isJsonRpcError(response)) {
            return Effect.fail(toRpcError("transport.requestBatch", requests, response.error));
          }
        }
        return Effect.succeed(responses.map((response) => (response as { result: T }).result));
      })
    );
  };

  const close = () =>
    transport.close
      ? Effect.tryPromise({
          try: async () => {
            await transport.close?.();
          },
          catch: (error) => toTransportError("transport.close", null, error)
        })
      : Effect.succeed(undefined);

  return {
    requestRaw,
    requestBatchRaw,
    request,
    requestBatch,
    close
  };
};
