import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { JsonRpcRequest, JsonRpcResponse, Transport } from "@kundera-sn/kundera-ts/transport";
import { makeTransportService, TransportService } from "../Transport/TransportService.js";
import { RpcBatch } from "./RpcBatch.js";
import { RpcBatchService } from "./RpcBatchService.js";

describe("RpcBatch", () => {
  it("batches requests and preserves order", async () => {
    const transport: Transport = {
      type: "custom",
      async request(_request: JsonRpcRequest): Promise<JsonRpcResponse> {
        throw new Error("not used");
      },
      async requestBatch(requests: JsonRpcRequest[]): Promise<JsonRpcResponse[]> {
        const responses = requests.map((req) => ({
          jsonrpc: "2.0",
          id: req.id ?? 0,
          result: `${req.method}-ok`
        }));
        return responses.reverse();
      }
    };

    const transportLayer = Layer.succeed(TransportService, makeTransportService(transport));
    const batchLayer = RpcBatch({ maxBatchSize: 10, maxWaitTime: 1 });

    const program = Effect.gen(function* () {
      const batch = yield* RpcBatchService;
      const results = yield* Effect.all([
        batch.request<string>("starknet_chainId"),
        batch.request<string>("starknet_blockNumber")
      ]);
      return results;
    }).pipe(Effect.provide(batchLayer), Effect.provide(transportLayer));

    const results = await Effect.runPromise(program);
    expect(results).toEqual(["starknet_chainId-ok", "starknet_blockNumber-ok"]);
  });

  it("maps JSON-RPC error to RpcError", async () => {
    const transport: Transport = {
      type: "custom",
      async request(_request: JsonRpcRequest): Promise<JsonRpcResponse> {
        throw new Error("not used");
      },
      async requestBatch(requests: JsonRpcRequest[]): Promise<JsonRpcResponse[]> {
        return requests.map((req) => ({
          jsonrpc: "2.0",
          id: req.id ?? 0,
          error: { code: 42, message: "nope" }
        })) as JsonRpcResponse[];
      }
    };

    const transportLayer = Layer.succeed(TransportService, makeTransportService(transport));
    const batchLayer = RpcBatch({ maxBatchSize: 10, maxWaitTime: 1 });

    const program = Effect.gen(function* () {
      const batch = yield* RpcBatchService;
      return yield* batch.request<string>("starknet_chainId");
    }).pipe(Effect.provide(batchLayer), Effect.provide(transportLayer));

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("RpcError");
    }
  });
});
