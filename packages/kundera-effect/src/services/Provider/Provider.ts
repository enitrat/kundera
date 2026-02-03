/**
 * Provider service live layer built on TransportService.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "./ProviderService.js";
import { TransportService } from "../Transport/TransportService.js";

export const Provider = Layer.effect(
  ProviderService,
  Effect.gen(function* () {
    const transport = yield* TransportService;
    return {
      request: <T>({ method, params }: { method: string; params?: unknown[] | object }) =>
        transport.request<T>(method, params as unknown[] | Record<string, unknown>)
    };
  })
);
