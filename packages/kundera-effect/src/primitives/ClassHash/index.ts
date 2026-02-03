import {
  ClassHash,
  type ClassHashType
} from "kundera-sn/ClassHash";
import type { Felt252Input } from "kundera-sn/Felt252";
import { tryPrimitive } from "../utils.js";

export type { ClassHashType } from "kundera-sn/ClassHash";

export { ClassHash } from "kundera-sn/ClassHash";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "ClassHash.from",
    value,
    "felt < 2^251",
    () => ClassHash(value)
  );
