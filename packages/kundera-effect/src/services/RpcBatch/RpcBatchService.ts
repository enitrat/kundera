/**
 * RpcBatch service definition for batching JSON-RPC calls.
 */

import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import { RpcError, TransportError } from "../../errors.js";

export type RpcBatchShape = {
  request: <T>(
    method: string,
    params?: unknown[] | Record<string, unknown>
  ) => Effect.Effect<T, RpcError | TransportError>;
};

export class RpcBatchService extends Context.Tag("RpcBatchService")<
  RpcBatchService,
  RpcBatchShape
>() {}
