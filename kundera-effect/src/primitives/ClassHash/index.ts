import {
  ClassHash,
  type ClassHashType,
  type Felt252Input
} from "kundera-sn/primitives";
import { tryPrimitive } from "../utils.js";

export type { ClassHashType } from "kundera-sn/primitives";

export { ClassHash } from "kundera-sn/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "ClassHash.from",
    value,
    "felt < 2^251",
    () => ClassHash(value)
  );
