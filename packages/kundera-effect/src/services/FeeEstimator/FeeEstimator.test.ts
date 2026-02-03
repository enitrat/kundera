import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import { DefaultFeeEstimator } from "./DefaultFeeEstimator.js";
import { FeeEstimatorService } from "./FeeEstimatorService.js";

const SAMPLE_ESTIMATE = {
  gas_consumed: "0x10",
  gas_price: "0x20",
  data_gas_consumed: "0x2",
  data_gas_price: "0x3",
  overall_fee: "0x200",
  unit: "WEI"
} as const;

describe("FeeEstimatorService", () => {
  it("estimateOne returns first estimate", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: () => Effect.succeed([SAMPLE_ESTIMATE])
    });

    const program = Effect.gen(function* () {
      const estimator = yield* FeeEstimatorService;
      return yield* estimator.estimateOne({} as never);
    }).pipe(Effect.provide(DefaultFeeEstimator), Effect.provide(providerLayer));

    const estimate = await Effect.runPromise(program);
    expect(estimate).toEqual(SAMPLE_ESTIMATE);
  });

  it("applyMultiplier scales fee values", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: () => Effect.succeed([SAMPLE_ESTIMATE])
    });

    const program = Effect.gen(function* () {
      const estimator = yield* FeeEstimatorService;
      return estimator.applyMultiplier(SAMPLE_ESTIMATE, 1.5);
    }).pipe(Effect.provide(DefaultFeeEstimator), Effect.provide(providerLayer));

    const adjusted = await Effect.runPromise(program);
    expect(adjusted.gas_consumed).toBe("0x18");
    expect(adjusted.gas_price).toBe("0x30");
    expect(adjusted.data_gas_consumed).toBe("0x3");
    expect(adjusted.data_gas_price).toBe("0x5");
    expect(adjusted.overall_fee).toBe("0x300");
  });

  it("toResourceBounds maps estimate to bounds", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: () => Effect.succeed([SAMPLE_ESTIMATE])
    });

    const program = Effect.gen(function* () {
      const estimator = yield* FeeEstimatorService;
      return estimator.toResourceBounds(SAMPLE_ESTIMATE, { multiplier: 1.5 });
    }).pipe(Effect.provide(DefaultFeeEstimator), Effect.provide(providerLayer));

    const bounds = await Effect.runPromise(program);
    expect(bounds.l1_gas.max_amount).toBe(16n);
    expect(bounds.l1_gas.max_price_per_unit).toBe(48n);
    expect(bounds.l1_data_gas.max_amount).toBe(2n);
    expect(bounds.l1_data_gas.max_price_per_unit).toBe(5n);
  });
});
