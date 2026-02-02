import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import type { JsonRpcRequest, JsonRpcResponse, Transport } from "kundera-sn/transport";
import * as TransportEffect from "./index.js";

describe("transport effect wrappers", () => {
  it("request returns response", async () => {
    const transport: Transport = {
      type: "custom",
      async request<R = unknown>(_request: JsonRpcRequest): Promise<JsonRpcResponse<R>> {
        return {
          jsonrpc: "2.0",
          id: 1,
          result: "ok"
        } as JsonRpcResponse<R>;
      },
      async requestBatch() {
        return [];
      }
    };

    const response = await Effect.runPromise(
      TransportEffect.request<string>(transport, {
        jsonrpc: "2.0",
        id: 1,
        method: "starknet_chainId",
        params: []
      })
    );

    expect(response.jsonrpc).toBe("2.0");
    if ("result" in response) {
      expect(response.result).toBe("ok");
    }
  });

  it("request maps thrown errors to TransportError", async () => {
    const transport: Transport = {
      type: "custom",
      async request(): Promise<JsonRpcResponse> {
        throw new Error("boom");
      },
      async requestBatch() {
        return [];
      }
    };

    const result = await Effect.runPromise(
      Effect.either(
        TransportEffect.request(transport, {
          jsonrpc: "2.0",
          id: 1,
          method: "starknet_chainId",
          params: []
        })
      )
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("TransportError");
    }
  });
});
