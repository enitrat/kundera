import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Schema from "effect/Schema";

import * as Primitives from "../index.js";

describe("primitives schema", () => {
  it.effect("decodes a contract address from hex", () =>
    Effect.gen(function* () {
      const value = yield* Schema.decodeUnknown(Primitives.ContractAddress.Hex)(
        "0x123",
      );

      expect(value.toHex()).toMatch(/^0x[0-9a-f]+$/);
    }),
  );

  it.effect("fails invalid contract address with parse error", () =>
    Effect.gen(function* () {
      const parseError = yield* Schema.decodeUnknown(
        Primitives.ContractAddress.Hex,
      )("not-a-hex-address").pipe(Effect.flip);

      const message = Primitives.formatParseErrorTree(parseError);
      expect(message.length).toBeGreaterThan(0);
    }),
  );

  it.effect("decodes a felt from helper", () =>
    Effect.gen(function* () {
      const felt = yield* Primitives.decodeFelt252("0xabc");
      expect(felt.toHex()).toMatch(/^0x[0-9a-f]+$/);
    }),
  );
});
