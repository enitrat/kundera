/**
 * RawProvider service definition to wrap a provider instance.
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { RequestArguments } from "@kundera-sn/kundera-ts/provider";
import { RpcError, TransportError } from "../../errors.js";

export type RawProviderShape = {
  request: <T>(args: RequestArguments) => Effect.Effect<T, RpcError | TransportError>;
};

export class RawProviderService extends Context.Tag("RawProviderService")<
  RawProviderService,
  RawProviderShape
>() {}
