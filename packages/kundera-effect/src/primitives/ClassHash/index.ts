import {
  ClassHash,
  type ClassHashType
} from "@kundera-sn/kundera-ts/ClassHash";
import type { Felt252Input } from "@kundera-sn/kundera-ts/Felt252";
import { tryPrimitive } from "../utils.js";

export type { ClassHashType } from "@kundera-sn/kundera-ts/ClassHash";

export { ClassHash } from "@kundera-sn/kundera-ts/ClassHash";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "ClassHash.from",
    value,
    "felt < 2^251",
    () => ClassHash(value)
  );
