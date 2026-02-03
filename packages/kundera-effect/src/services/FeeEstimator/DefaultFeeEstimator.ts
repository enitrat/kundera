import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { BlockId, BroadcastedTxn, FeeEstimate, SimulationFlag } from "@kundera-sn/kundera-ts/jsonrpc";
import type { ResourceBoundsInput } from "../Account/AccountService.js";
import { ProviderService } from "../Provider/index.js";
import {
  FeeEstimatorService,
  FeeEstimationError,
  type ResourceBoundsOptions
} from "./FeeEstimatorService.js";

const MULTIPLIER_PRECISION = 1000n;
const MULTIPLIER_PRECISION_NUMBER = Number(MULTIPLIER_PRECISION);

const applyMultiplier = (value: bigint, multiplier: number): bigint => {
  const numerator = BigInt(Math.round(multiplier * MULTIPLIER_PRECISION_NUMBER));
  return (value * numerator + MULTIPLIER_PRECISION - 1n) / MULTIPLIER_PRECISION;
};

const toBigInt = (value: string | bigint) => (typeof value === "string" ? BigInt(value) : value);
const toHex = (value: bigint) => `0x${value.toString(16)}`;

const applyMultiplierToEstimate = (estimate: FeeEstimate, multiplier: number): FeeEstimate => ({
  ...estimate,
  gas_consumed: toHex(applyMultiplier(toBigInt(estimate.gas_consumed), multiplier)),
  gas_price: toHex(applyMultiplier(toBigInt(estimate.gas_price), multiplier)),
  data_gas_consumed: toHex(applyMultiplier(toBigInt(estimate.data_gas_consumed), multiplier)),
  data_gas_price: toHex(applyMultiplier(toBigInt(estimate.data_gas_price), multiplier)),
  overall_fee: toHex(applyMultiplier(toBigInt(estimate.overall_fee), multiplier))
});

const toResourceBounds = (
  estimate: FeeEstimate,
  options: ResourceBoundsOptions | undefined,
  defaultMultiplier: number
): ResourceBoundsInput => {
  const multiplier = options?.multiplier ?? defaultMultiplier;
  const l2Gas = options?.l2Gas ?? { max_amount: 0n, max_price_per_unit: 0n };

  return {
    l1_gas: {
      max_amount: toBigInt(estimate.gas_consumed),
      max_price_per_unit: applyMultiplier(toBigInt(estimate.gas_price), multiplier)
    },
    l2_gas: l2Gas,
    l1_data_gas: {
      max_amount: toBigInt(estimate.data_gas_consumed),
      max_price_per_unit: applyMultiplier(toBigInt(estimate.data_gas_price), multiplier)
    }
  };
};

export const makeFeeEstimator = (defaultMultiplier = 1) =>
  Layer.effect(
    FeeEstimatorService,
    Effect.gen(function* () {
      const provider = yield* ProviderService;

      const estimate = (
        transactions: BroadcastedTxn[],
        simulationFlags: SimulationFlag[] = [],
        blockId: BlockId = "pending"
      ) =>
        provider
          .request<FeeEstimate[]>({
            method: "starknet_estimateFee",
            params: [transactions, simulationFlags, blockId]
          })
          .pipe(
            Effect.mapError((error) => {
              const message = error instanceof Error ? error.message : "Fee estimation failed";
              return new FeeEstimationError({
                input: { transactions, simulationFlags, blockId },
                message,
                cause: error
              });
            })
          );

      const estimateOne = (
        transaction: BroadcastedTxn,
        simulationFlags: SimulationFlag[] = [],
        blockId: BlockId = "pending"
      ) =>
        estimate([transaction], simulationFlags, blockId).pipe(
          Effect.flatMap((estimates) => {
            const first = estimates[0];
            if (!first) {
              return Effect.fail(
                new FeeEstimationError({
                  input: { transaction, simulationFlags, blockId },
                  message: "Fee estimate missing for transaction"
                })
              );
            }
            return Effect.succeed(first);
          })
        );

      return {
        estimate,
        estimateOne,
        applyMultiplier: (estimateValue: FeeEstimate, multiplier = defaultMultiplier) =>
          applyMultiplierToEstimate(estimateValue, multiplier),
        toResourceBounds: (estimateValue: FeeEstimate, options?: ResourceBoundsOptions) =>
          toResourceBounds(estimateValue, options, defaultMultiplier)
      };
    })
  );

export const DefaultFeeEstimator = makeFeeEstimator(1);
