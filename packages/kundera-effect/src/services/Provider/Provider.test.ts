import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { JsonRpcRequest, JsonRpcResponse, Transport } from "kundera-sn/transport";
import { makeTransportService, TransportService } from "../Transport/TransportService.js";
import { Provider } from "./Provider.js";
import { ProviderService } from "./ProviderService.js";

describe("Provider", () => {
  it("delegates request to TransportService", async () => {
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

    const transportLayer = Layer.succeed(TransportService, makeTransportService(transport));
    const program = Effect.gen(function* () {
      const provider = yield* ProviderService;
      return yield* provider.request<string>({ method: "starknet_chainId", params: [] });
    }).pipe(Effect.provide(Provider), Effect.provide(transportLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBe("ok");
  });
});
