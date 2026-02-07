import { Context, Effect, Layer } from "effect";

import type { RpcError, TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export interface RawRequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[];
}

export interface RawProviderServiceShape {
  readonly request: (
    args: RawRequestArguments,
    options?: RequestOptions,
  ) => Effect.Effect<unknown, TransportError | RpcError>;
}

export class RawProviderService extends Context.Tag("@kundera/RawProviderService")<
  RawProviderService,
  RawProviderServiceShape
>() {}

export const RawProviderLive: Layer.Layer<
  RawProviderService,
  never,
  ProviderService
> = Layer.effect(
  RawProviderService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;

    return {
      request: (args, options) =>
        provider.request(args.method, args.params, options),
    } satisfies RawProviderServiceShape;
  }),
);
