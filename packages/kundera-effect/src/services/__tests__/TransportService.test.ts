import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Schedule from "effect/Schedule";
import type { JsonRpcRequest, JsonRpcResponse, Transport } from "@kundera-sn/kundera-ts/transport";

import {
  TransportLive,
  TransportService,
  withInterceptors,
  withRequestInterceptor,
  withRetrySchedule,
  withResponseInterceptor,
  withRetries,
  withTimeout,
} from "../TransportService.js";

describe("TransportService", () => {
  it.effect("maps JSON-RPC error responses to RpcError", () => {
    const transport: Transport = {
      type: "custom",
      request: async () =>
        ({
          jsonrpc: "2.0",
          id: 1,
          error: { code: -32001, message: "boom" },
        }) as JsonRpcResponse<unknown>,
      requestBatch: async () => [],
    };

    return Effect.gen(function* () {
      const program = Effect.flatMap(TransportService, (service) =>
        service.request<number>("starknet_blockNumber"),
      );

      const error = yield* Effect.flip(program);

      expect(error._tag).toBe("RpcError");
      expect(error.method).toBe("starknet_blockNumber");
      expect(error.code).toBe(-32001);
    }).pipe(Effect.provide(TransportLive(transport)));
  });

  it.effect("retries transport failures and eventually succeeds", () => {
    let attempts = 0;

    const transport: Transport = {
      type: "custom",
      request: async (request: JsonRpcRequest) => {
        attempts += 1;

        if (attempts < 3) {
          throw new Error("temporary failure");
        }

        return {
          jsonrpc: "2.0",
          id: request.id ?? 1,
          result: 42,
        } as JsonRpcResponse<number>;
      },
      requestBatch: async () => [],
    };

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(TransportService, (service) =>
        service.request<number>("starknet_blockNumber", [], {
          retries: 2,
          retryDelayMs: 0,
        }),
      );

      expect(result).toBe(42);
      expect(attempts).toBe(3);
    }).pipe(Effect.provide(TransportLive(transport)));
  });

  it.effect("supports fiber-local retry overrides", () => {
    let attempts = 0;

    const transport: Transport = {
      type: "custom",
      request: async (request: JsonRpcRequest) => {
        attempts += 1;

        if (attempts < 2) {
          throw new Error("temporary failure");
        }

        return {
          jsonrpc: "2.0",
          id: request.id ?? 1,
          result: 7,
        } as JsonRpcResponse<number>;
      },
      requestBatch: async () => [],
    };

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(TransportService, (service) =>
        service.request<number>("starknet_blockNumber"),
      ).pipe(withRetries(1));

      expect(result).toBe(7);
      expect(attempts).toBe(2);
    }).pipe(Effect.provide(TransportLive(transport)));
  });

  it.effect("supports fiber-local retry schedule overrides", () => {
    let attempts = 0;

    const transport: Transport = {
      type: "custom",
      request: async (request: JsonRpcRequest) => {
        attempts += 1;

        if (attempts < 3) {
          throw new Error("temporary failure");
        }

        return {
          jsonrpc: "2.0",
          id: request.id ?? 1,
          result: 99,
        } as JsonRpcResponse<number>;
      },
      requestBatch: async () => [],
    };

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(TransportService, (service) =>
        service.request<number>("starknet_blockNumber"),
      ).pipe(withRetrySchedule(Schedule.recurs(2)));

      expect(result).toBe(99);
      expect(attempts).toBe(3);
    }).pipe(Effect.provide(TransportLive(transport)));
  });

  it.effect("applies request/response interceptors", () => {
    let observedMethod = "";

    const transport: Transport = {
      type: "custom",
      request: async (request: JsonRpcRequest) => {
        observedMethod = request.method;
        return {
          jsonrpc: "2.0",
          id: request.id ?? 1,
          result: 10,
        } as JsonRpcResponse<number>;
      },
      requestBatch: async () => [],
    };

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(TransportService, (service) =>
        service.request<number>("starknet_blockNumber"),
      ).pipe(
        withRequestInterceptor((ctx) =>
          Effect.succeed({
            ...ctx,
            request: {
              ...ctx.request,
              method: "starknet_chainId",
            },
          }),
        ),
        withResponseInterceptor((ctx) =>
          Effect.succeed({
            ...ctx,
            response: {
              ...ctx.response,
              result: (ctx.response as JsonRpcResponse<number>).result + 1,
            } as JsonRpcResponse<number>,
          }),
        ),
      );

      expect(result).toBe(11);
      expect(observedMethod).toBe("starknet_chainId");
    }).pipe(Effect.provide(TransportLive(transport)));
  });

  it.effect("invokes error interceptor on transport error", () => {
    let invoked = false;

    const transport: Transport = {
      type: "custom",
      request: async () => {
        throw new Error("network down");
      },
      requestBatch: async () => [],
    };

    return Effect.gen(function* () {
      const program = Effect.flatMap(TransportService, (service) =>
        service.request<number>("starknet_blockNumber"),
      ).pipe(
        withInterceptors({
          onError: () =>
            Effect.sync(() => {
              invoked = true;
            }),
        }),
      );

      yield* Effect.flip(program);
      expect(invoked).toBe(true);
    }).pipe(Effect.provide(TransportLive(transport)));
  });

  it.effect("calls underlying transport.close when service is closed", () => {
    let closeCalled = false;

    const transport: Transport = {
      type: "custom",
      request: async () =>
        ({
          jsonrpc: "2.0",
          id: 1,
          result: null,
        }) as JsonRpcResponse<unknown>,
      requestBatch: async () => [],
      close: async () => {
        closeCalled = true;
      },
    };

    return Effect.gen(function* () {
      yield* Effect.flatMap(TransportService, (service) => service.close);
      expect(closeCalled).toBe(true);
    }).pipe(Effect.provide(TransportLive(transport)));
  });

  it.effect("applies timeout override via FiberRef", () => {
    let receivedTimeout: number | undefined;

    const transport: Transport = {
      type: "custom",
      request: async (_request, options) => {
        receivedTimeout = options?.timeout;
        return {
          jsonrpc: "2.0",
          id: 1,
          result: "ok",
        } as JsonRpcResponse<string>;
      },
      requestBatch: async () => [],
    };

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(TransportService, (service) =>
        service.request<string>("starknet_chainId"),
      ).pipe(withTimeout(1234));

      expect(result).toBe("ok");
      expect(receivedTimeout).toBe(1234);
    }).pipe(Effect.provide(TransportLive(transport)));
  });

  it.effect("accepts Effect duration input for timeout override", () => {
    let receivedTimeout: number | undefined;

    const transport: Transport = {
      type: "custom",
      request: async (_request, options) => {
        receivedTimeout = options?.timeout;
        return {
          jsonrpc: "2.0",
          id: 1,
          result: "ok",
        } as JsonRpcResponse<string>;
      },
      requestBatch: async () => [],
    };

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(TransportService, (service) =>
        service.request<string>("starknet_chainId"),
      ).pipe(withTimeout("1 second"));

      expect(result).toBe("ok");
      expect(receivedTimeout).toBe(1000);
    }).pipe(Effect.provide(TransportLive(transport)));
  });
});
