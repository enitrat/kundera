import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";
import {
  ContractAddress,
  type ContractAddressType,
} from "@kundera-sn/kundera-ts";

const ContractAddressTypeSchema = Schema.Any as Schema.Schema<ContractAddressType>;

export const Hex: Schema.Schema<ContractAddressType, string> = Schema.transformOrFail(
  Schema.String,
  ContractAddressTypeSchema,
  {
    strict: true,
    decode: (value, _, ast) => {
      try {
        return ParseResult.succeed(ContractAddress(value));
      } catch (error) {
        return ParseResult.fail(
          new ParseResult.Type(
            ast,
            value,
            error instanceof Error ? error.message : "Invalid contract address",
          ),
        );
      }
    },
    encode: (value) => ParseResult.succeed(value.toHex()),
  },
).annotations({
  identifier: "Kundera.ContractAddress.Hex",
  title: "Starknet Contract Address",
  description: "A Starknet contract address encoded as a hex string.",
  message: () => "Invalid Starknet contract address",
});
