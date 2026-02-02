import {
  encodeShortString,
  encodeShortStringHex,
  decodeShortString,
  MAX_SHORT_STRING_LENGTH,
  type Felt252Type
} from "kundera-sn/primitives";
import { tryPrimitive } from "../utils.js";

export { MAX_SHORT_STRING_LENGTH } from "kundera-sn/primitives";

export const encode = (value: string) =>
  tryPrimitive(
    "ShortString.encode",
    value,
    "ASCII string (max 31 chars)",
    () => encodeShortString(value)
  );

export const encodeHex = (value: string) =>
  tryPrimitive(
    "ShortString.encodeHex",
    value,
    "ASCII string (max 31 chars)",
    () => encodeShortStringHex(value)
  );

export const decode = (value: bigint | string | Felt252Type) =>
  tryPrimitive(
    "ShortString.decode",
    value,
    "felt-compatible value",
    () => decodeShortString(value)
  );

export { encodeShortString, encodeShortStringHex, decodeShortString } from "kundera-sn/primitives";
