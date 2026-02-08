import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { BatchLive, BatchService } from "../BatchService.js";
import { ProviderService } from "../ProviderService.js";

describe("BatchService", () => {
  it.effect("requestMany forwards to ProviderService.requestBatch", () => {
    let observedBatch: readonly { readonly method: string }[] = [];

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed(null as T),
      requestBatch: <T>(requests: readonly { readonly method: string }[]) => {
        observedBatch = requests;
        return Effect.succeed(["0x1", "0x2"] as readonly T[]);
      },
    });

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(BatchService, (batch) =>
        batch.requestMany<string>([
          { method: "starknet_chainId" },
          { method: "starknet_blockNumber" },
        ]),
      );

      expect(observedBatch.map((item) => item.method)).toEqual([
        "starknet_chainId",
        "starknet_blockNumber",
      ]);
      expect(result).toEqual(["0x1", "0x2"]);
    }).pipe(
      Effect.provide(BatchLive()),
      Effect.provide(providerLayer),
    );
  });

  it.effect("enqueueRequest batches concurrent requests", () => {
    let batchCalls = 0;
    let observedSize = 0;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed(null as T),
      requestBatch: <T>(requests: readonly { readonly method: string }[]) => {
        batchCalls += 1;
        observedSize = requests.length;
        return Effect.succeed(
          requests.map((request) => `${request.method}-ok`) as readonly T[],
        );
      },
    });

    return Effect.gen(function* () {
      const [first, second] = yield* Effect.flatMap(BatchService, (batch) =>
        Effect.all([
          batch.enqueueRequest<string>({ method: "starknet_chainId" }),
          batch.enqueueRequest<string>({ method: "starknet_blockNumber" }),
        ], { concurrency: "unbounded" }),
      );

      expect(first).toBe("starknet_chainId-ok");
      expect(second).toBe("starknet_blockNumber-ok");
      expect(batchCalls).toBe(1);
      expect(observedSize).toBe(2);
    }).pipe(
      Effect.provide(
        BatchLive({
          maxBatchSize: 2,
          maxWaitTimeMs: 10_000,
        }),
      ),
      Effect.provide(providerLayer),
    );
  });
});
