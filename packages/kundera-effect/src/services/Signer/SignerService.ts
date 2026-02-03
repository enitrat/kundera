import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type { AddInvokeTransactionResult } from "kundera-sn/jsonrpc";
import type { InvokeV3Params } from "../Account/AccountService.js";

export type InvokeParams = Omit<InvokeV3Params, "nonce" | "chainId"> & {
  nonce?: bigint;
  chainId?: bigint;
};

export class SignerError extends Data.TaggedError("SignerError")<{
  readonly input: unknown;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type SignerShape = {
  readonly invoke: (params: InvokeParams) => Effect.Effect<AddInvokeTransactionResult, SignerError>;
};

export class SignerService extends Context.Tag("SignerService")<
  SignerService,
  SignerShape
>() {}
