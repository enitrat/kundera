import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import { Felt252 } from "@kundera-sn/kundera-ts/Felt252";
import * as Wasm from "./index.js";

describe("wasm effect wrappers", () => {
  it("isWasmAvailable returns boolean", () => {
    expect(typeof Wasm.isWasmAvailable()).toBe("boolean");
  });

  it("loadWasmCrypto returns result or CryptoError", async () => {
    const result = await Effect.runPromise(Effect.either(Wasm.loadWasmCrypto()));
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("CryptoError");
    } else {
      expect(result.right).toBeUndefined();
    }
  });

  it("pedersenHash returns result or CryptoError", async () => {
    const result = await Effect.runPromise(
      Effect.either(Wasm.pedersenHash(Felt252(1n), Felt252(2n)))
    );

    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("CryptoError");
    } else {
      expect(result.right).toBeDefined();
    }
  });
});
