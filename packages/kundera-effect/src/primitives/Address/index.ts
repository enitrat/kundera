import { Effect } from "effect";
import type { ContractAddressType as AddressType } from "@kundera-sn/kundera-ts/ContractAddress";
import {
  ContractAddress,
  type ContractAddressType,
  isValidContractAddress as isValidContractAddressInternal,
  MAX_CONTRACT_ADDRESS
} from "@kundera-sn/kundera-ts/ContractAddress";
import type { Felt252Type } from "@kundera-sn/kundera-ts/Felt252";
import { PrimitiveError } from "../../errors.js";

export type { AddressType };

const wrap = <T>(operation: string, input: unknown, thunk: () => T) =>
  Effect.try({
    try: thunk,
    catch: (error) =>
      new PrimitiveError({
        message: error instanceof Error ? error.message : "Primitive operation failed",
        operation,
        input,
        expected: "Address",
        cause: error instanceof Error ? error : undefined
      })
  });

export const from = (value: unknown) =>
  wrap("Address.from", value, () => ContractAddress.from(value as ContractAddressType));

export const isValid = (value: AddressType) =>
  wrap("Address.isValid", value, () => ContractAddress.isValid(value as ContractAddressType));

export const isValidContractAddress = (value: AddressType) =>
  wrap(
    "Address.isValidContractAddress",
    value,
    () => isValidContractAddressInternal(value as unknown as Felt252Type)
  );

export const Address = ContractAddress;
export const MAX_ADDRESS = MAX_CONTRACT_ADDRESS;
