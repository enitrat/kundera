import {
  StorageKey,
  type StorageKeyType
} from "kundera-sn/StorageKey";
import type { Felt252Input } from "kundera-sn/Felt252";
import { tryPrimitive } from "../utils.js";

export type { StorageKeyType } from "kundera-sn/StorageKey";

export { StorageKey } from "kundera-sn/StorageKey";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "StorageKey.from",
    value,
    "felt < 2^251",
    () => StorageKey(value)
  );
