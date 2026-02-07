import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { ChainLive, ChainService } from "../ChainService.js";
import { ProviderService } from "../ProviderService.js";

describe("ChainService", () => {
  it.effect("resolves chain id and known network name", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_chainId") {
          return Effect.succeed("0x534e5f5345504f4c4941" as T);
        }

        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(ChainService, (chain) =>
        Effect.all({
          chainId: chain.chainId(),
          networkName: chain.networkName(),
          rpcUrl: Effect.succeed(chain.rpcUrl()),
        }),
      );

      expect(result.chainId).toBe("0x534e5f5345504f4c4941");
      expect(result.networkName).toBe("sepolia");
      expect(result.rpcUrl).toBe("https://starknet-sepolia.example");
    }).pipe(
      Effect.provide(ChainLive({ rpcUrl: "https://starknet-sepolia.example" })),
      Effect.provide(providerLayer),
    );
  });

  it.effect("infers devnet when chain id is unknown and rpc url is local", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed("0xdeadbeef" as T),
    });

    return Effect.gen(function* () {
      const networkName = yield* Effect.flatMap(ChainService, (chain) => chain.networkName());

      expect(networkName).toBe("devnet");
    }).pipe(
      Effect.provide(ChainLive({ rpcUrl: "http://127.0.0.1:5050/rpc" })),
      Effect.provide(providerLayer),
    );
  });
});
