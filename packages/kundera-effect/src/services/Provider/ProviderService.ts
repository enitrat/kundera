/**
 * Provider service definition for Starknet JSON-RPC.
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { RequestArguments } from "@kundera-sn/kundera-ts/provider";
import { RpcError, TransportError } from "../../errors.js";

export type ProviderShape = {
  request: <T>(args: RequestArguments) => Effect.Effect<T, RpcError | TransportError>;
};

export class ProviderService extends Context.Tag("ProviderService")<
  ProviderService,
  ProviderShape
>() {}
