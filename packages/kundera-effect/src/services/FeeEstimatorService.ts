import { Context, Effect, Layer } from "effect";
import type {
  BlockId,
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  BroadcastedInvokeTxn,
  FeeEstimate,
  SimulationFlag,
} from "@kundera-sn/kundera-ts/jsonrpc";

import type { RpcError, TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export type EstimatableTransaction =
  | BroadcastedInvokeTxn
  | BroadcastedDeclareTxn
  | BroadcastedDeployAccountTxn;

export interface FeeEstimateOptions {
  readonly simulationFlags?: readonly SimulationFlag[];
  readonly blockId?: BlockId;
  readonly requestOptions?: RequestOptions;
}

export interface FeeEstimatorServiceShape {
  readonly estimate: (
    transactions: readonly EstimatableTransaction[],
    options?: FeeEstimateOptions,
  ) => Effect.Effect<FeeEstimate[], TransportError | RpcError>;
}

export class FeeEstimatorService extends Context.Tag("@kundera/FeeEstimatorService")<
  FeeEstimatorService,
  FeeEstimatorServiceShape
>() {}

export const FeeEstimatorLive: Layer.Layer<
  FeeEstimatorService,
  never,
  ProviderService
> = Layer.effect(
  FeeEstimatorService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;

    const estimate: FeeEstimatorServiceShape["estimate"] = (transactions, options) =>
      provider.request<FeeEstimate[]>(
        "starknet_estimateFee",
        [
          transactions,
          options?.simulationFlags ?? [],
          options?.blockId ?? "latest",
        ],
        options?.requestOptions,
      );

    return {
      estimate,
    } satisfies FeeEstimatorServiceShape;
  }),
);
