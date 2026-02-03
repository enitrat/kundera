import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import { DefaultNonceManager } from "./DefaultNonceManager.js";
import { NonceManagerService } from "./NonceManagerService.js";

describe("NonceManager", () => {
  it("consumes sequential nonces", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: () => Effect.succeed("1")
    });

    const program = Effect.gen(function* () {
      const manager = yield* NonceManagerService;
      const n1 = yield* manager.consume("0xabc", 1n);
      const n2 = yield* manager.consume("0xabc", 1n);
      return [n1, n2];
    }).pipe(Effect.provide(DefaultNonceManager), Effect.provide(providerLayer));

    const [n1, n2] = await Effect.runPromise(program);
    expect(n1).toBe(1n);
    expect(n2).toBe(2n);
  });
});
