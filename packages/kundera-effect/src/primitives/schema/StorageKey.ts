import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";
import { StorageKey, type StorageKeyType } from "@kundera-sn/kundera-ts";

const StorageKeyTypeSchema = Schema.declare<StorageKeyType>(
  (u): u is StorageKeyType => u instanceof Uint8Array && u.length === 32,
  { identifier: "StorageKey" },
);

export const Hex: Schema.Schema<StorageKeyType, string> = Schema.transformOrFail(
  Schema.String,
  StorageKeyTypeSchema,
  {
    strict: true,
    decode: (value, _, ast) => {
      try {
        return ParseResult.succeed(StorageKey(value));
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(
            ast,
            value,
            error instanceof Error ? error.message : "Invalid storage key",
          ),
        );
      }
    },
    encode: (value) => ParseResult.succeed(value.toHex()),
  },
).annotations({
  identifier: "Kundera.StorageKey.Hex",
  title: "Starknet Storage Key",
  description: "A Starknet storage key encoded as a hex string.",
  message: () => "Invalid Starknet storage key",
});
