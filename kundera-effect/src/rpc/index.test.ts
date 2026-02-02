import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import { ContractAddress, Felt252 } from "kundera-sn/primitives";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  Transport,
  TransportRequestOptions
} from "kundera-sn/transport";
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

  it("starknet_getNonce formats address and uses pending default", async () => {
    let captured: JsonRpcRequest | null = null;
    const transport = createMockTransport((request) => {
      captured = request;
      return {
        jsonrpc: "2.0",
        id: request.id ?? 1,
        result: "0x1"
      };
    });

    const address = ContractAddress(0x123n);
    await Effect.runPromise(Rpc.starknet_getNonce(transport, address));

    expect(captured).not.toBeNull();
    expect(captured!.method).toBe("starknet_getNonce");
    expect(captured!.params).toEqual(["pending", address.toHex()]);
  });

  it("starknet_getStorageAt formats key", async () => {
    let captured: JsonRpcRequest | null = null;
    const transport = createMockTransport((request) => {
      captured = request;
      return {
        jsonrpc: "2.0",
        id: request.id ?? 1,
        result: "0xdead"
      };
    });

    const key = Felt252(1n);
    await Effect.runPromise(Rpc.starknet_getStorageAt(transport, "0xabc", key));

    expect(captured).not.toBeNull();
    expect(captured!.params).toEqual(["0xabc", key.toHex(), "latest"]);
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
