import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import { Felt252 } from "@kundera-sn/kundera-ts/Felt252";
import * as WasmLoader from "./index.js";

describe("wasm-loader effect wrappers", () => {
  it("isWasmAvailable returns boolean", () => {
    expect(typeof WasmLoader.isWasmAvailable()).toBe("boolean");
  });

  it("loadWasmCrypto returns result or CryptoError", async () => {
    const result = await Effect.runPromise(
      Effect.either(WasmLoader.loadWasmCrypto())
    );
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("CryptoError");
    } else {
      expect(result.right).toBeUndefined();
    }
  });

  it("wasmFeltAdd returns result or CryptoError", async () => {
    const result = await Effect.runPromise(
      Effect.either(WasmLoader.wasmFeltAdd(Felt252(1n), Felt252(2n)))
    );
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("CryptoError");
    } else {
      expect(result.right.toBigInt()).toBe(3n);
    }
  });
});
