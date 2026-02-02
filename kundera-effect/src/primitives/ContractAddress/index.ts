import {
  ContractAddress,
  type ContractAddressType,
  type Felt252Input,
  MAX_CONTRACT_ADDRESS
} from "kundera-sn/primitives";
import { tryPrimitive } from "../utils.js";

export type { ContractAddressType } from "kundera-sn/primitives";
export { MAX_CONTRACT_ADDRESS } from "kundera-sn/primitives";

export { ContractAddress } from "kundera-sn/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "ContractAddress.from",
    value,
    "felt < 2^251",
    () => ContractAddress(value)
  );

export const isValid = (value: Felt252Input) => ContractAddress.isValid(value);
