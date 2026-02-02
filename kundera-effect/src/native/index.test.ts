import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import { Felt252 } from "@starknet/kundera/primitives";
import * as Native from "./index.js";

describe("native effect wrappers", () => {
  it("isNativeAvailable returns boolean", () => {
    expect(typeof Native.isNativeAvailable()).toBe("boolean");
  });

  it("pedersenHash returns result or CryptoError", async () => {
    const result = await Effect.runPromise(
      Effect.either(Native.pedersenHash(Felt252(1n), Felt252(2n)))
    );

    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("CryptoError");
    } else {
      expect(result.right).toBeDefined();
    }
  });

  it("loadWasmCrypto returns result or CryptoError", async () => {
    const result = await Effect.runPromise(Effect.either(Native.loadWasmCrypto()));
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("CryptoError");
    } else {
      expect(result.right).toBeUndefined();
    }
  });
});
