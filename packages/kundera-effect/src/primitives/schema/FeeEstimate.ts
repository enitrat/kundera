import * as Schema from "effect/Schema";
import {
  feeEstimateFromRpc,
  feeEstimateToRpc,
  type FeeEstimateType,
} from "@kundera-sn/kundera-ts";
import { isFelt252, isObject } from "./_predicates.js";
import { rpcTransform } from "./_rpcSchema.js";

type RpcFeeEstimate = Parameters<typeof feeEstimateFromRpc>[0];

const FeeEstimateTypeSchema = Schema.declare<FeeEstimateType>(
  (value): value is FeeEstimateType =>
    isObject(value) &&
    isFelt252(value.l1_gas_consumed) &&
    isFelt252(value.l1_gas_price) &&
    isFelt252(value.l2_gas_consumed) &&
    isFelt252(value.l2_gas_price) &&
    isFelt252(value.l1_data_gas_consumed) &&
    isFelt252(value.l1_data_gas_price) &&
    isFelt252(value.overall_fee) &&
    typeof value.unit === "string",
  { identifier: "FeeEstimate" },
);

export const Rpc: Schema.Schema<FeeEstimateType, RpcFeeEstimate> = rpcTransform(
  FeeEstimateTypeSchema,
  feeEstimateFromRpc,
  feeEstimateToRpc,
  {
    identifier: "Kundera.FeeEstimate.Rpc",
    title: "Starknet Fee Estimate",
    description: "Fee estimate decoded from Starknet RPC wire data.",
    errorMessage: "Invalid Starknet fee-estimate RPC value",
  },
);
