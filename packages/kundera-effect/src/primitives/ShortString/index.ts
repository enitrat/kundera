import {
  encodeShortString,
  encodeShortStringHex,
  decodeShortString
} from "kundera-sn/ShortString";
import { MAX_SHORT_STRING_LENGTH } from "kundera-sn/Felt252";
import type { Felt252Type } from "kundera-sn/Felt252";
import { tryPrimitive } from "../utils.js";

export { MAX_SHORT_STRING_LENGTH } from "kundera-sn/Felt252";

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

export { encodeShortString, encodeShortStringHex, decodeShortString } from "kundera-sn/ShortString";
