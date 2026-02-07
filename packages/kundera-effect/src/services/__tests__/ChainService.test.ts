import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";

import { ChainLive, ChainService } from "../ChainService.js";
import { ProviderService } from "../ProviderService.js";

describe("ChainService", () => {
  it("resolves chain id and known network name", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_chainId") {
          return Effect.succeed("0x534e5f5345504f4c4941" as T);
        }

        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    const result = await Effect.runPromise(
      Effect.flatMap(ChainService, (chain) =>
        Effect.all({
          chainId: chain.chainId(),
          networkName: chain.networkName(),
          rpcUrl: Effect.succeed(chain.rpcUrl()),
        }),
      ).pipe(
        Effect.provide(ChainLive({ rpcUrl: "https://starknet-sepolia.example" })),
        Effect.provide(providerLayer),
      ),
    );

    expect(result.chainId).toBe("0x534e5f5345504f4c4941");
    expect(result.networkName).toBe("sepolia");
    expect(result.rpcUrl).toBe("https://starknet-sepolia.example");
  });

  it("infers devnet when chain id is unknown and rpc url is local", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed("0xdeadbeef" as T),
    });

    const networkName = await Effect.runPromise(
      Effect.flatMap(ChainService, (chain) => chain.networkName()).pipe(
        Effect.provide(ChainLive({ rpcUrl: "http://127.0.0.1:5050/rpc" })),
        Effect.provide(providerLayer),
      ),
    );

    expect(networkName).toBe("devnet");
  });
});
