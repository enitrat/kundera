import {
  ContractAddress,
  type ContractAddressType,
  MAX_CONTRACT_ADDRESS
} from "kundera-sn/ContractAddress";
import type { Felt252Input } from "kundera-sn/Felt252";
import { tryPrimitive } from "../utils.js";

export type { ContractAddressType } from "kundera-sn/ContractAddress";
export { MAX_CONTRACT_ADDRESS } from "kundera-sn/ContractAddress";

export { ContractAddress } from "kundera-sn/ContractAddress";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "ContractAddress.from",
    value,
    "felt < 2^251",
    () => ContractAddress(value)
  );

export const isValid = (value: Felt252Input) => ContractAddress.isValid(value);
