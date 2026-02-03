import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type { BroadcastedInvokeTxn } from "kundera-sn/jsonrpc";
import type { ResourceBoundsMapping as RpcResourceBounds } from "kundera-sn/jsonrpc";

export type ResourceBoundsInput = {
  l1_gas: { max_amount: bigint; max_price_per_unit: bigint };
  l2_gas: { max_amount: bigint; max_price_per_unit: bigint };
  l1_data_gas?: { max_amount: bigint; max_price_per_unit: bigint };
};

export type InvokeV3Params = {
  calls: Array<{
    contractAddress: string;
    entrypoint: string;
    calldata: bigint[];
  }>;
  nonce: bigint;
  chainId: bigint;
  resourceBounds: ResourceBoundsInput;
  tip?: bigint;
  paymasterData?: bigint[];
  accountDeploymentData?: bigint[];
  nonceDataAvailabilityMode?: 0;
  feeDataAvailabilityMode?: 0;
};

export class AccountError extends Data.TaggedError("AccountError")<{
  readonly input: unknown;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type AccountShape = {
  readonly address: string;
  readonly publicKey: string;
  readonly signInvokeV3: (
    params: InvokeV3Params
  ) => Effect.Effect<BroadcastedInvokeTxn, AccountError>;
  readonly toRpcResourceBounds: (input: ResourceBoundsInput) => RpcResourceBounds;
};

export class AccountService extends Context.Tag("AccountService")<
  AccountService,
  AccountShape
>() {}
