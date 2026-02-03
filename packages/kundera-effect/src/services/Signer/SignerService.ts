import * as Context from "effect/Context";
import { Schema } from "effect";
import type * as Effect from "effect/Effect";
import type { AddInvokeTransactionResult } from "@kundera-sn/kundera-ts/jsonrpc";
import type { NonceManagerService } from "../NonceManager/NonceManagerService.js";
import type { InvokeV3Params } from "../Account/AccountService.js";

export type InvokeParams = Omit<InvokeV3Params, "nonce" | "chainId"> & {
  nonce?: bigint;
  chainId?: bigint;
};

export class SignerError extends Schema.TaggedError<SignerError>()(
  "SignerError",
  {
    input: Schema.Unknown,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export type SignerShape = {
  readonly invoke: (
    params: InvokeParams
  ) => Effect.Effect<AddInvokeTransactionResult, SignerError, NonceManagerService>;
};

export class SignerService extends Context.Tag("SignerService")<
  SignerService,
  SignerShape
>() {}
