import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";
import { ClassHash, type ClassHashType } from "@kundera-sn/kundera-ts";

const ClassHashTypeSchema = Schema.declare<ClassHashType>(
  (u): u is ClassHashType => u instanceof Uint8Array && u.length === 32,
  { identifier: "ClassHash" },
);

export const Hex: Schema.Schema<ClassHashType, string> = Schema.transformOrFail(
  Schema.String,
  ClassHashTypeSchema,
  {
    strict: true,
    decode: (value, _, ast) => {
      try {
        return ParseResult.succeed(ClassHash(value));
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(
            ast,
            value,
            error instanceof Error ? error.message : "Invalid class hash",
          ),
        );
      }
    },
    encode: (value) => ParseResult.succeed(value.toHex()),
  },
).annotations({
  identifier: "Kundera.ClassHash.Hex",
  title: "Starknet Class Hash",
  description: "A Starknet class hash encoded as a hex string.",
  message: () => "Invalid Starknet class hash",
});
