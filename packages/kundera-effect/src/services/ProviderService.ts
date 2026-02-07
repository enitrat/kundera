import { Context, Effect, Layer, Ref, Schedule } from "effect";
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

const isNoSuchElementException = (
  error: unknown,
): error is { readonly _tag: "NoSuchElementException" } =>
  typeof error === "object" &&
  error !== null &&
  "_tag" in error &&
  error._tag === "NoSuchElementException";

export const FallbackHttpProviderLive = (
  endpoints: readonly [FallbackProviderEndpoint, ...FallbackProviderEndpoint[]],
): Layer.Layer<ProviderService> =>
  Layer.effect(
    ProviderService,
    Effect.gen(function* () {
      const transports = endpoints.map((endpoint) => ({
        endpoint,
        transport: httpTransport(endpoint.url, endpoint.transportOptions),
      }));
      const requestIdRef = yield* Ref.make(0);

      const nextRequestId = Ref.updateAndGet(requestIdRef, (n) => n + 1);

      const makeEndpointRequest = <T>(
        endpoint: FallbackProviderEndpoint,
        transport: ReturnType<typeof httpTransport>,
        method: string,
        params?: readonly unknown[],
        options?: RequestOptions,
      ): Effect.Effect<T, TransportErrorData | RpcErrorData> => {
        const attempts = Math.max(endpoint.attempts ?? 1, 1);
        const retryDelayMs = Math.max(endpoint.retryDelayMs ?? 0, 0);

        const requestOnce: Effect.Effect<T, TransportErrorData | RpcErrorData> =
          Effect.gen(function* () {
          const id = yield* nextRequestId;
          const payload = createRequest(method, params ? [...params] : [], id);

          const response = yield* Effect.tryPromise({
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
          });

          if (isJsonRpcError(response)) {
            if (isRetryableRpcError(response.error)) {
              return yield* Effect.fail(
                new TransportErrorData({
                  operation: `${method}@${endpoint.url}`,
                  message: `Retryable RPC error: ${response.error.message}`,
                  cause: response.error,
                }),
              );
            }

            return yield* Effect.fail(
              new RpcErrorData({
                method,
                code: response.error.code,
                message: response.error.message,
                data: response.error.data,
              }),
            );
          }

            return response.result as T;
          });

        return requestOnce.pipe(
          Effect.retry({
            times: attempts - 1,
            schedule: Schedule.spaced(`${retryDelayMs} millis`),
            while: (error: TransportErrorData | RpcErrorData) =>
              error._tag === "TransportError",
          }),
        );
      };

      return {
        request: <T>(method: string, params?: readonly unknown[], options?: RequestOptions) =>
          Effect.firstSuccessOf(
            transports.map(({ endpoint, transport }) =>
              makeEndpointRequest<T>(endpoint, transport, method, params, options),
            ),
          ).pipe(
            Effect.catchAll((error): Effect.Effect<T, TransportErrorData | RpcErrorData> =>
              isNoSuchElementException(error)
                ? Effect.fail(
                    new TransportErrorData({
                      operation: method,
                      message: "All fallback provider endpoints failed",
                    }),
                  )
                : Effect.fail(error as TransportErrorData | RpcErrorData),
            ),
          ),
      } satisfies ProviderServiceShape;
    }),
  );

export const FallbackHttpProviderFromUrls = (
  urls: readonly [string, ...string[]],
): Layer.Layer<ProviderService> =>
  FallbackHttpProviderLive(urls.map((url) => ({ url })) as [
    FallbackProviderEndpoint,
    ...FallbackProviderEndpoint[],
  ]);
