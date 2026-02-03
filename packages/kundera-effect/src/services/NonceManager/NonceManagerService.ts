import * as Context from "effect/Context";
import { Schema } from "effect";
import type * as Effect from "effect/Effect";
import type { ProviderService } from "../Provider/index.js";

export class NonceError extends Schema.TaggedError<NonceError>()(
  "NonceError",
  {
    address: Schema.String,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export type NonceManagerShape = {
  readonly get: (
    address: string,
    chainId: bigint
  ) => Effect.Effect<bigint, NonceError, ProviderService>;
  readonly consume: (
    address: string,
    chainId: bigint
  ) => Effect.Effect<bigint, NonceError, ProviderService>;
  readonly increment: (address: string, chainId: bigint) => Effect.Effect<void>;
  readonly reset: (address: string, chainId: bigint) => Effect.Effect<void>;
};

export class NonceManagerService extends Context.Tag("NonceManagerService")<
  NonceManagerService,
  NonceManagerShape
>() {}
