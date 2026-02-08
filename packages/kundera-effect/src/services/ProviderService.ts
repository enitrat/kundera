import { Context, Effect, Layer, Schedule } from "effect";

import { RpcError, TransportError } from "../errors.js";
import {
  HttpTransportLive,
  type RequestOptions,
  TransportService,
  WebSocketTransportLive,
} from "./TransportService.js";
import type {
  HttpTransportOptions,
  WebSocketTransportOptions,
} from "@kundera-sn/kundera-ts/transport";

export interface ProviderServiceShape {
  readonly request: <T>(
    method: string,
    params?: readonly unknown[],
    options?: RequestOptions,
  ) => Effect.Effect<T, TransportError | RpcError>;

  readonly requestBatch: <T>(
    requests: readonly {
      readonly method: string;
      readonly params?: readonly unknown[];
    }[],
    options?: RequestOptions,
  ) => Effect.Effect<readonly T[], TransportError | RpcError>;
}

export class ProviderService extends Context.Tag("@kundera/ProviderService")<
  ProviderService,
  ProviderServiceShape
>() {}

export const ProviderLive: Layer.Layer<ProviderService, never, TransportService> =
  Layer.effect(
    ProviderService,
    Effect.gen(function* () {
      const transport = yield* TransportService;

      return {
        request: transport.request,
        requestBatch: transport.requestBatch,
      } satisfies ProviderServiceShape;
    }),
  );

export const HttpProviderLive = (
  url: string,
  options?: HttpTransportOptions,
): Layer.Layer<ProviderService> =>
  ProviderLive.pipe(Layer.provide(HttpTransportLive(url, options)));

export const WebSocketProviderLive = (
  url: string,
  options?: WebSocketTransportOptions,
): Layer.Layer<ProviderService, TransportError> =>
  ProviderLive.pipe(Layer.provide(WebSocketTransportLive(url, options)));

export interface FallbackProviderEndpoint {
  readonly url: string;
  readonly transportOptions?: HttpTransportOptions;
  readonly attempts?: number;
  readonly retryDelayMs?: number;
}

const JSON_RPC_INTERNAL_ERROR = -32603;
const JSON_RPC_SERVER_ERROR_MIN = -32099;
const JSON_RPC_SERVER_ERROR_MAX = -32000;

const isRetryableRpcError = (error: { code: number; message: string }): boolean =>
  error.code === JSON_RPC_INTERNAL_ERROR ||
  (error.code >= JSON_RPC_SERVER_ERROR_MIN &&
    error.code <= JSON_RPC_SERVER_ERROR_MAX) ||
  error.message.toLowerCase().includes("timeout") ||
  error.message.toLowerCase().includes("temporarily") ||
  error.message.toLowerCase().includes("unavailable");

export const FallbackHttpProviderLive = (
  endpoints: readonly [FallbackProviderEndpoint, ...FallbackProviderEndpoint[]],
): Layer.Layer<ProviderService> =>
  Layer.effect(
    ProviderService,
    Effect.gen(function* () {
      // Resolve a FiberRef-aware TransportServiceShape per endpoint
      const transports = yield* Effect.all(
        endpoints.map((endpoint) =>
          Effect.provide(
            TransportService,
            HttpTransportLive(endpoint.url, endpoint.transportOptions),
          ).pipe(Effect.map((transport) => ({ endpoint, transport }))),
        ),
      );

      const request: ProviderServiceShape["request"] = <T>(
        method: string,
        params?: readonly unknown[],
        options?: RequestOptions,
      ): Effect.Effect<T, TransportError | RpcError> => {
        const allFailed: Effect.Effect<T, TransportError | RpcError> = Effect.fail(
          new TransportError({
            operation: method,
            message: "All fallback provider endpoints failed",
          }),
        );

        return transports.reduceRight<Effect.Effect<T, TransportError | RpcError>>(
          (fallback, { endpoint, transport }) => {
            const attempts = Math.max(endpoint.attempts ?? 1, 1);
            const retryDelayMs = Math.max(endpoint.retryDelayMs ?? 0, 0);

            const attempt: Effect.Effect<T, TransportError | RpcError> =
              Effect.gen(function* () {
                const result = yield* transport.request<T>(method, params, options).pipe(
                  Effect.catchTag("RpcError", (error): Effect.Effect<T, TransportError | RpcError> =>
                    isRetryableRpcError(error)
                      ? Effect.fail(
                          new TransportError({
                            operation: `${method}@${endpoint.url}`,
                            message: `Retryable RPC error: ${error.message}`,
                            cause: error,
                          }),
                        )
                      : Effect.fail(error),
                  ),
                );
                return result;
              });

            return attempt.pipe(
              Effect.retry(
                Schedule.recurs(attempts - 1).pipe(
                  Schedule.addDelay(() => `${retryDelayMs} millis`),
                  Schedule.whileInput(
                    (error: TransportError | RpcError) => error._tag === "TransportError",
                  ),
                ),
              ),
              Effect.catchTag("TransportError", () => fallback),
            );
          },
          allFailed,
        );
      };

      const requestBatch: ProviderServiceShape["requestBatch"] = (requests, options) =>
        Effect.forEach(requests, (requestEntry) =>
          request(requestEntry.method, requestEntry.params, options),
        );

      return {
        request,
        requestBatch,
      } satisfies ProviderServiceShape;
    }),
  );

export const FallbackHttpProviderFromUrls = (
  urls: readonly [string, ...string[]],
): Layer.Layer<ProviderService> =>
  // Trust boundary: caller guarantees non-empty tuple via the input type
  // `readonly [string, ...string[]]`, so the mapped array is also non-empty.
  FallbackHttpProviderLive(urls.map((url) => ({ url })) as [
    FallbackProviderEndpoint,
    ...FallbackProviderEndpoint[],
  ]);
