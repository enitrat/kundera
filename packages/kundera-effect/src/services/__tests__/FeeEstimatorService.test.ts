import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { ProviderService } from "../ProviderService.js";
import {
  FeeEstimatorLive,
  FeeEstimatorService,
} from "../FeeEstimatorService.js";

describe("FeeEstimatorService", () => {
  it("maps estimate to starknet_estimateFee with default options", async () => {
    let called:
      | {
          method: string;
          params?: readonly unknown[];
        }
      | undefined;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        called = { method, params };
        return Effect.succeed(
          [
            {
              l1_gas_consumed: "0x0",
              l1_gas_price: "0x1",
              l2_gas_consumed: "0x0",
              l2_gas_price: "0x1",
              l1_data_gas_consumed: "0x0",
              l1_data_gas_price: "0x1",
              overall_fee: "0x1",
              unit: "WEI",
            },
          ] as T,
        );
      },
    });

    const tx = {
      type: "INVOKE" as const,
      version: "0x1" as const,
      sender_address: "0xabc",
      calldata: ["0x1"],
      max_fee: "0x10",
      signature: ["0x1", "0x2"],
      nonce: "0x0",
    };

    const estimates = await Effect.runPromise(
      Effect.flatMap(FeeEstimatorService, (service) => service.estimate([tx])).pipe(
        Effect.provide(FeeEstimatorLive),
        Effect.provide(providerLayer),
      ),
    );

    expect(called?.method).toBe("starknet_estimateFee");
    expect(called?.params?.[0]).toEqual([tx]);
    expect(called?.params?.[1]).toEqual([]);
    expect(called?.params?.[2]).toBe("latest");
    expect(estimates).toHaveLength(1);
  });

  it("passes simulation flags and custom block id", async () => {
    let calledParams: readonly unknown[] | undefined;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(_method: string, params?: readonly unknown[]) => {
        calledParams = params;
        return Effect.succeed([] as T);
      },
    });

    const tx = {
      type: "INVOKE" as const,
      version: "0x1" as const,
      sender_address: "0xabc",
      calldata: ["0x1"],
      max_fee: "0x10",
      signature: ["0x1", "0x2"],
      nonce: "0x0",
    };

    await Effect.runPromise(
      Effect.flatMap(FeeEstimatorService, (service) =>
        service.estimate([tx], {
          simulationFlags: ["SKIP_VALIDATE"],
          blockId: { block_number: 12 },
        }),
      ).pipe(
        Effect.provide(FeeEstimatorLive),
        Effect.provide(providerLayer),
      ),
    );

    expect(calledParams).toEqual([[tx], ["SKIP_VALIDATE"], { block_number: 12 }]);
  });
});
