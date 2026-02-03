import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import type { JsonRpcRequest, JsonRpcResponse, Transport } from "kundera-sn/transport";
import { makeTransportService } from "./TransportService.js";

describe("TransportService", () => {
  it("request returns result", async () => {
    const transport: Transport = {
      type: "custom",
      async request<R = unknown>(request: JsonRpcRequest): Promise<JsonRpcResponse<R>> {
        return {
          jsonrpc: "2.0",
          id: request.id ?? 1,
          result: "ok"
        } as JsonRpcResponse<R>;
      },
      async requestBatch() {
        return [];
      }
    };

    const service = makeTransportService(transport);
    const result = await Effect.runPromise(service.request<string>("starknet_chainId"));
    expect(result).toBe("ok");
  });

  it("request maps JSON-RPC error to RpcError", async () => {
    const transport: Transport = {
      type: "custom",
      async request<R = unknown>(request: JsonRpcRequest): Promise<JsonRpcResponse<R>> {
        return {
          jsonrpc: "2.0",
          id: request.id ?? 1,
          error: { code: 1234, message: "boom" }
        } as JsonRpcResponse<R>;
      },
      async requestBatch() {
        return [];
      }
    };

    const service = makeTransportService(transport);
    const result = await Effect.runPromise(
      Effect.either(service.request<string>("starknet_chainId"))
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("RpcError");
    }
  });

  it("retries on transport error", async () => {
    let attempts = 0;
    const transport: Transport = {
      type: "custom",
      async request<R = unknown>(request: JsonRpcRequest): Promise<JsonRpcResponse<R>> {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("boom");
        }
        return {
          jsonrpc: "2.0",
          id: request.id ?? 1,
          result: "ok"
        } as JsonRpcResponse<R>;
      },
      async requestBatch() {
        return [];
      }
    };

    const service = makeTransportService(transport, {
      retry: { maxRetries: 3, delayMs: 1 }
    });
    const result = await Effect.runPromise(service.request<string>("starknet_chainId"));
    expect(result).toBe("ok");
    expect(attempts).toBeGreaterThan(1);
  });

  it("times out slow requests", async () => {
    const transport: Transport = {
      type: "custom",
      async request<R = unknown>(request: JsonRpcRequest): Promise<JsonRpcResponse<R>> {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          jsonrpc: "2.0",
          id: request.id ?? 1,
          result: "ok"
        } as JsonRpcResponse<R>;
      },
      async requestBatch() {
        return [];
      }
    };

    const service = makeTransportService(transport, { timeoutMs: 5 });
    const result = await Effect.runPromise(
      Effect.either(service.request<string>("starknet_chainId"))
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("TransportError");
    }
  });
});
