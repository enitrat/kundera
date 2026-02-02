import { Effect } from "effect";
import { Felt252, type Felt252Type } from "@starknet/kundera/primitives";
import {
  serializeU256 as serializeU256Base,
  deserializeU256 as deserializeU256Base,
  serializeArray as serializeArrayBase,
  deserializeArray as deserializeArrayBase,
  serializeByteArray as serializeByteArrayBase
} from "@starknet/kundera/serde";
import { SerdeError } from "../errors.js";

const trySerde = <T>(
  operation: string,
  input: unknown,
  expected: string | undefined,
  thunk: () => T
): Effect.Effect<T, SerdeError> =>
  Effect.try({
    try: thunk,
    catch: (error) =>
      new SerdeError({
        message: error instanceof Error ? error.message : "Serde operation failed",
        operation,
        input,
        expected,
        cause: error instanceof Error ? error : undefined
      })
  });

export { SerdeError } from "../errors.js";

export const serializeU256 = (value: bigint) =>
  trySerde("serializeU256", value, "u256 bigint", () => {
    const [low, high] = serializeU256Base(value);
    return [Felt252(low), Felt252(high)] as [Felt252Type, Felt252Type];
  });

export const deserializeU256 = (felts: [Felt252Type, Felt252Type]) =>
  trySerde("deserializeU256", felts, "[low, high] felts", () =>
    deserializeU256Base(felts)
  );

export const serializeArray = (felts: Felt252Type[]) =>
  trySerde("serializeArray", felts, "felt array", () =>
    serializeArrayBase(felts).map((felt) => Felt252(felt))
  );

export const deserializeArray = (felts: Felt252Type[], offset = 0) =>
  trySerde(
    "deserializeArray",
    { felts, offset },
    "felt array with length prefix",
    () => {
      const result = deserializeArrayBase(felts, offset);
      return {
        array: result.array.map((felt) => Felt252(felt)),
        nextOffset: result.nextOffset
      };
    }
  );

export const serializeByteArray = (data: Uint8Array) =>
  trySerde("serializeByteArray", data, "Uint8Array", () =>
    serializeByteArrayBase(data).map((felt) => Felt252(felt))
  );

export const CairoSerde = {
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray
} as const;
