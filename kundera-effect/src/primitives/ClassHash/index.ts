import {
  ClassHash,
  type ClassHashType,
  type Felt252Input
} from "@starknet/kundera/primitives";
import { tryPrimitive } from "../utils.js";

export type { ClassHashType } from "@starknet/kundera/primitives";

export { ClassHash } from "@starknet/kundera/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "ClassHash.from",
    value,
    "felt < 2^251",
    () => ClassHash(value)
  );
