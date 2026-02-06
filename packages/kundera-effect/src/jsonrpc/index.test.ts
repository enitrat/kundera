import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  Transport,
  TransportRequestOptions
} from "@kundera-sn/kundera-ts/transport";
import * as Rpc from "./index.js";

function createMockTransport<T = unknown>(
  handler: (request: JsonRpcRequest) => JsonRpcResponse<T>
): Transport {
  return {
    type: "http",
    async request<R = unknown>(
      request: JsonRpcRequest,
      _options?: TransportRequestOptions
    ): Promise<JsonRpcResponse<R>> {
      return handler(request) as JsonRpcResponse<R>;
    },
    async requestBatch() {
      return [];
    }
  };
}

describe("rpc effect wrappers", () => {
  it("starknet_chainId returns result", async () => {
    const transport = createMockTransport(() => ({
      jsonrpc: "2.0",
      id: 1,
      result: "0x534e5f4d41494e"
    }));

    const result = await Effect.runPromise(Rpc.starknet_chainId(transport));
    expect(result).toBe("0x534e5f4d41494e");
  });

  it("starknet_getNonce sends correct method and params", async () => {
    let captured: JsonRpcRequest | null = null;
    const transport = createMockTransport((request) => {
      captured = request;
      return {
        jsonrpc: "2.0",
        id: request.id ?? 1,
        result: "0x1"
      };
    });

    await Effect.runPromise(Rpc.starknet_getNonce(transport, "pending", "0x123"));

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("starknet_getNonce");
    expect(captured!.params).toEqual(["pending", "0x123"]);
  });

  it("starknet_getStorageAt sends correct params with default blockId", async () => {
    let captured: JsonRpcRequest | null = null;
    const transport = createMockTransport((request) => {
      captured = request;
      return {
        jsonrpc: "2.0",
        id: request.id ?? 1,
        result: "0xdead"
      };
    });

    await Effect.runPromise(Rpc.starknet_getStorageAt(transport, "0xabc", "0x1"));

    expect(captured).not.toBeNull();
    expect(captured!.params).toEqual(["0xabc", "0x1", "latest"]);
  });

  it("errors are mapped to RpcError", async () => {
    const transport = createMockTransport((request) => ({
      jsonrpc: "2.0",
      id: request.id ?? 1,
      error: {
        code: 20,
        message: "Contract not found",
        data: { contract_address: "0x123" }
      }
    }));

    const result = await Effect.runPromise(
      Effect.either(Rpc.starknet_chainId(transport))
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("RpcError");
      expect(result.left.message).toBe("Contract not found");
    }
  });
});
