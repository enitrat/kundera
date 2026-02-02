import {
  StorageKey,
  type StorageKeyType,
  type Felt252Input
} from "@starknet/kundera/primitives";
import { tryPrimitive } from "../utils.js";

export type { StorageKeyType } from "@starknet/kundera/primitives";

export { StorageKey } from "@starknet/kundera/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "StorageKey.from",
    value,
    "felt < 2^251",
    () => StorageKey(value)
  );
