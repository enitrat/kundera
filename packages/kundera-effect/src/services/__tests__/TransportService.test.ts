import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import type { JsonRpcRequest, JsonRpcResponse, Transport } from "@kundera-sn/kundera-ts/transport";

import {
  TransportLive,
  TransportService,
  withInterceptors,
  withRequestInterceptor,
  withResponseInterceptor,
  withRetries,
} from "../TransportService.js";

describe("TransportService", () => {
  it("maps JSON-RPC error responses to RpcError", async () => {
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

    const program = Effect.flatMap(TransportService, (service) =>
      service.request<number>("starknet_blockNumber"),
    ).pipe(Effect.provide(TransportLive(transport)));

    const error = await Effect.runPromise(Effect.flip(program));

    expect(error._tag).toBe("RpcError");
    expect(error.method).toBe("starknet_blockNumber");
    expect(error.code).toBe(-32001);
  });

  it("retries transport failures and eventually succeeds", async () => {
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

    const program = Effect.flatMap(TransportService, (service) =>
      service.request<number>("starknet_blockNumber", [], {
        retries: 2,
        retryDelayMs: 0,
      }),
    ).pipe(Effect.provide(TransportLive(transport)));

    const value = await Effect.runPromise(program);

    expect(value).toBe(42);
    expect(attempts).toBe(3);
  });

  it("supports fiber-local retry overrides", async () => {
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

    const program = Effect.flatMap(TransportService, (service) =>
      service.request<number>("starknet_blockNumber"),
    ).pipe(
      withRetries(1),
      Effect.provide(TransportLive(transport)),
    );

    const value = await Effect.runPromise(program);

    expect(value).toBe(7);
    expect(attempts).toBe(2);
  });

  it("applies request/response interceptors", async () => {
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

    const program = Effect.flatMap(TransportService, (service) =>
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
      Effect.provide(TransportLive(transport)),
    );

    const value = await Effect.runPromise(program);

    expect(value).toBe(11);
    expect(observedMethod).toBe("starknet_chainId");
  });

  it("invokes error interceptor on transport error", async () => {
    let invoked = false;

    const transport: Transport = {
      type: "custom",
      request: async () => {
        throw new Error("network down");
      },
      requestBatch: async () => [],
    };

    const program = Effect.flatMap(TransportService, (service) =>
      service.request<number>("starknet_blockNumber"),
    ).pipe(
      withInterceptors({
        onError: () =>
          Effect.sync(() => {
            invoked = true;
          }),
      }),
      Effect.provide(TransportLive(transport)),
    );

    await Effect.runPromise(Effect.flip(program));
    expect(invoked).toBe(true);
  });
});
