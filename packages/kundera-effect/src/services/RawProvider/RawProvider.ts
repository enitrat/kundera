/**
 * RawProvider layer backed by a concrete provider instance.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { RequestArguments } from "kundera-sn/provider";
import { RpcError, TransportError } from "../../errors.js";
import { RawProviderService } from "./RawProviderService.js";

export type ProviderLike = {
  request: <T>(args: RequestArguments) => Promise<T>;
};

const toProviderError = (operation: string, input: unknown, error: unknown) =>
  error instanceof RpcError || error instanceof TransportError
    ? error
    : new RpcError({
        message: error instanceof Error ? error.message : "Provider request failed",
        operation,
        input,
        expected: "JSON-RPC success response",
        cause: error instanceof Error ? error : undefined
      });

export const RawProvider = (provider: ProviderLike) =>
  Layer.succeed(RawProviderService, {
    request: <T>(args: RequestArguments) =>
      Effect.tryPromise({
        try: () => provider.request<T>(args),
        catch: (error) => toProviderError("provider.request", args, error)
      })
  });
