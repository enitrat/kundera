/**
 * RawProvider layer backed by TransportService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { RawProviderService } from "./RawProviderService.js";
import { TransportService } from "../Transport/TransportService.js";

export const RawProviderTransport = Layer.effect(
  RawProviderService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    return {
      request: <T>({ method, params }: { method: string; params?: unknown[] | object }) =>
        transport.request<T>(method, params as unknown[] | Record<string, unknown>)
    };
  })
);
