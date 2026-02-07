import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";
import { Felt252, type Felt252Type } from "@kundera-sn/kundera-ts";

const Felt252TypeSchema = Schema.Any as Schema.Schema<Felt252Type>;

export const Hex: Schema.Schema<Felt252Type, string> = Schema.transformOrFail(
  Schema.String,
  Felt252TypeSchema,
  {
    strict: true,
    decode: (value, _, ast) => {
      try {
        return ParseResult.succeed(Felt252(value));
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(
            ast,
            value,
            error instanceof Error ? error.message : "Invalid felt252 value",
          ),
        );
      }
    },
    encode: (value) => ParseResult.succeed(value.toHex()),
  },
).annotations({
  identifier: "Kundera.Felt252.Hex",
  title: "Starknet Felt252",
  description: "A Starknet felt252 value encoded as a hex string.",
  message: () => "Invalid Starknet felt252 value",
});
