import {
  StorageKey,
  type StorageKeyType,
  type Felt252Input
} from "kundera-sn/primitives";
import { tryPrimitive } from "../utils.js";

export type { StorageKeyType } from "kundera-sn/primitives";

export { StorageKey } from "kundera-sn/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "StorageKey.from",
    value,
    "felt < 2^251",
    () => StorageKey(value)
  );
