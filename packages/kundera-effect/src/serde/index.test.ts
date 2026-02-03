import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import { Felt252 } from "kundera-sn/Felt252";
import * as Serde from "./index.js";

describe("serde effect wrappers", () => {
  it("serializeU256 returns low/high felts", async () => {
    const result = await Effect.runPromise(Serde.serializeU256(5n));
    expect(result[0].toBigInt()).toBe(5n);
    expect(result[1].toBigInt()).toBe(0n);
  });

  it("deserializeU256 returns bigint", async () => {
    const felts = [Felt252(5n), Felt252(1n)] as const;
    const result = await Effect.runPromise(Serde.deserializeU256(felts));
    expect(result).toBe((1n << 128n) | 5n);
  });

  it("serializeU256 fails on negative input", async () => {
    const result = await Effect.runPromise(
      Effect.either(Serde.serializeU256(-1n))
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("SerdeError");
    }
  });

  it("deserializeArray fails on invalid offset", async () => {
    const result = await Effect.runPromise(
      Effect.either(Serde.deserializeArray([Felt252(0n)], 4))
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("SerdeError");
    }
  });
});
