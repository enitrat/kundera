import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type { ProviderService } from "../Provider/index.js";

export class NonceError extends Data.TaggedError("NonceError")<{
  readonly address: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

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
