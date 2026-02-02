import {
  ContractAddress,
  type ContractAddressType,
  type Felt252Input,
  MAX_CONTRACT_ADDRESS
} from "@starknet/kundera/primitives";
import { tryPrimitive } from "../utils.js";

export type { ContractAddressType } from "@starknet/kundera/primitives";
export { MAX_CONTRACT_ADDRESS } from "@starknet/kundera/primitives";

export { ContractAddress } from "@starknet/kundera/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "ContractAddress.from",
    value,
    "felt < 2^251",
    () => ContractAddress(value)
  );

export const isValid = (value: Felt252Input) => ContractAddress.isValid(value);
