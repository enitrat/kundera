import { Context, Effect, Layer } from "effect";
import {
  createRequest,
  httpTransport,
  isJsonRpcError,
} from "@kundera-sn/kundera-ts/transport";

import { type RpcError, type TransportError } from "../errors.js";
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
import { RpcError as RpcErrorData, TransportError as TransportErrorData } from "../errors.js";

export interface ProviderServiceShape {
  readonly request: <T>(
    method: string,
    params?: readonly unknown[],
    options?: RequestOptions,
  ) => Effect.Effect<T, TransportError | RpcError>;
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

const isRetryableRpcError = (error: { code: number; message: string }): boolean =>
  error.code === -32603 ||
  (error.code <= -32000 && error.code >= -32099) ||
  error.message.toLowerCase().includes("timeout") ||
  error.message.toLowerCase().includes("temporarily") ||
  error.message.toLowerCase().includes("unavailable");

export const FallbackHttpProviderLive = (
  endpoints: readonly [FallbackProviderEndpoint, ...FallbackProviderEndpoint[]],
): Layer.Layer<ProviderService> => {
  const transports = endpoints.map((endpoint) => ({
    endpoint,
    transport: httpTransport(endpoint.url, endpoint.transportOptions),
  }));

  let requestId = 0;

  return Layer.succeed(ProviderService, {
    request: <T>(
      method: string,
      params?: readonly unknown[],
      options?: RequestOptions,
    ): Effect.Effect<T, TransportErrorData | RpcErrorData> =>
      Effect.gen(function* () {
        let lastTransportError: TransportErrorData | undefined;

        for (const { endpoint, transport } of transports) {
          const attempts = Math.max(endpoint.attempts ?? 1, 1);
          const retryDelayMs = Math.max(endpoint.retryDelayMs ?? 0, 0);

          for (let attempt = 1; attempt <= attempts; attempt += 1) {
            const payload = createRequest(method, params ? [...params] : [], ++requestId);

            const attemptResult = yield* Effect.either(
              Effect.tryPromise({
                try: () =>
                  transport.request<T>(
                    payload,
                    options?.timeoutMs ? { timeout: options.timeoutMs } : undefined,
                  ),
                catch: (cause) =>
                  new TransportErrorData({
                    operation: `${method}@${endpoint.url}`,
                    message: "Provider endpoint request failed",
                    cause,
                  }),
              }),
            );

            if (attemptResult._tag === "Left") {
              lastTransportError = attemptResult.left;
              if (attempt < attempts) {
                yield* Effect.sleep(`${retryDelayMs} millis`);
                continue;
              }
              break;
            }

            const response = attemptResult.right;

            if (isJsonRpcError(response)) {
              const rpcError = new RpcErrorData({
                method,
                code: response.error.code,
                message: response.error.message,
                data: response.error.data,
              });

              if (isRetryableRpcError(response.error) && attempt < attempts) {
                yield* Effect.sleep(`${retryDelayMs} millis`);
                continue;
              }

              if (isRetryableRpcError(response.error)) {
                break;
              }

              return yield* Effect.fail(rpcError);
            }

            return response.result as T;
          }
        }

        if (lastTransportError) {
          return yield* Effect.fail(lastTransportError);
        }

        return yield* Effect.fail(
          new TransportErrorData({
            operation: method,
            message: "All fallback provider endpoints failed",
          }),
        );
      }),
  });
};

export const FallbackHttpProviderFromUrls = (
  urls: readonly [string, ...string[]],
): Layer.Layer<ProviderService> =>
  FallbackHttpProviderLive(urls.map((url) => ({ url })) as [
    FallbackProviderEndpoint,
    ...FallbackProviderEndpoint[],
  ]);
