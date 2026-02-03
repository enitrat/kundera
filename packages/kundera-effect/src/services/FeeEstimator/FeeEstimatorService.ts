import * as Context from "effect/Context";
import { Schema } from "effect";
import type * as Effect from "effect/Effect";
import type {
  BlockId,
  BroadcastedTxn,
  FeeEstimate,
  SimulationFlag
} from "@kundera-sn/kundera-ts/jsonrpc";
import type { ResourceBoundsInput } from "../Account/AccountService.js";
import type { ProviderService } from "../Provider/index.js";

export class FeeEstimationError extends Schema.TaggedError<FeeEstimationError>()(
  "FeeEstimationError",
  {
    input: Schema.Unknown,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export type ResourceBoundsOptions = {
  multiplier?: number;
  l2Gas?: { max_amount: bigint; max_price_per_unit: bigint };
};

export type FeeEstimatorShape = {
  estimate: (
    transactions: BroadcastedTxn[],
    simulationFlags?: SimulationFlag[],
    blockId?: BlockId
  ) => Effect.Effect<FeeEstimate[], FeeEstimationError, ProviderService>;
  estimateOne: (
    transaction: BroadcastedTxn,
    simulationFlags?: SimulationFlag[],
    blockId?: BlockId
  ) => Effect.Effect<FeeEstimate, FeeEstimationError, ProviderService>;
  applyMultiplier: (estimate: FeeEstimate, multiplier?: number) => FeeEstimate;
  toResourceBounds: (
    estimate: FeeEstimate,
    options?: ResourceBoundsOptions
  ) => ResourceBoundsInput;
};

export class FeeEstimatorService extends Context.Tag("FeeEstimatorService")<
  FeeEstimatorService,
  FeeEstimatorShape
>() {}
