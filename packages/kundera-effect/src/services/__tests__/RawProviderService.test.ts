import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";

import { ProviderService } from "../ProviderService.js";
import { RawProviderLive, RawProviderService } from "../RawProviderService.js";

describe("RawProviderService", () => {
  it("forwards raw request arguments to provider", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) =>
        Effect.succeed(
          {
            method,
            params,
          } as T,
        ),
    });

    const program = Effect.flatMap(RawProviderService, (raw) =>
      raw.request({
        method: "starknet_getStorageAt",
        params: ["0x1", "0x2", "latest"],
      }),
    ).pipe(
      Effect.provide(RawProviderLive),
      Effect.provide(providerLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result).toEqual({
      method: "starknet_getStorageAt",
      params: ["0x1", "0x2", "latest"],
    });
  });
});
