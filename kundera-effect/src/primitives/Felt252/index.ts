import {
  Felt252,
  type Felt252Input,
  type Felt252Type,
  FIELD_PRIME,
  MAX_SHORT_STRING_LENGTH
} from "kundera-sn/primitives";
import { tryPrimitive } from "../utils.js";

export type { Felt252Input, Felt252Type } from "kundera-sn/primitives";
export { FIELD_PRIME, MAX_SHORT_STRING_LENGTH } from "kundera-sn/primitives";

export { Felt252 } from "kundera-sn/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "Felt252.from",
    value,
    "hex string, bigint, number, or 32-byte Uint8Array",
    () => Felt252(value)
  );

export const fromHex = (hex: string) =>
  tryPrimitive(
    "Felt252.fromHex",
    hex,
    "0x-prefixed hex string",
    () => Felt252.fromHex(hex)
  );

export const fromBigInt = (value: bigint) =>
  tryPrimitive(
    "Felt252.fromBigInt",
    value,
    "non-negative bigint < field prime",
    () => Felt252.fromBigInt(value)
  );

export const fromBytes = (bytes: Uint8Array) =>
  tryPrimitive(
    "Felt252.fromBytes",
    bytes,
    "32-byte Uint8Array",
    () => Felt252.fromBytes(bytes)
  );

export const isValid = (felt: Felt252Type) => Felt252.isValid(felt);
export const isZero = (felt: Felt252Type) => Felt252.isZero(felt);
export const equals = (a: Felt252Type, b: Felt252Type) => Felt252.equals(a, b);
export const toHex = (felt: Felt252Type) => Felt252.toHex(felt);
export const toBigInt = (felt: Felt252Type) => Felt252.toBigInt(felt);
