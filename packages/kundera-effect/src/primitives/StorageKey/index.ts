import {
  StorageKey,
  type StorageKeyType
} from "@kundera-sn/kundera-ts/StorageKey";
import type { Felt252Input } from "@kundera-sn/kundera-ts/Felt252";
import { tryPrimitive } from "../utils.js";

export type { StorageKeyType } from "@kundera-sn/kundera-ts/StorageKey";

export { StorageKey } from "@kundera-sn/kundera-ts/StorageKey";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "StorageKey.from",
    value,
    "felt < 2^251",
    () => StorageKey(value)
  );
