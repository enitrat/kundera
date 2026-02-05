import type { FunctionArgs, FunctionRet } from "../../src/abi/index";
import type { ContractAddressType } from "../../src/primitives/ContractAddress/types";
import type { Uint256Type } from "../../src/primitives/Uint256/types";

const ERC20_ABI_FOR_TYPE_TEST = [
  {
    type: "function",
    name: "balance_of",
    inputs: [{ name: "account", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;

type Assert<T extends true> = T;
type BalanceOfArgs = FunctionArgs<typeof ERC20_ABI_FOR_TYPE_TEST, "balance_of">;
type BalanceOfRet = FunctionRet<typeof ERC20_ABI_FOR_TYPE_TEST, "balance_of">;

export type GetContractArgsTypecheck = Assert<BalanceOfArgs extends ContractAddressType ? true : false>;
export type GetContractReturnTypecheck = Assert<BalanceOfRet extends Uint256Type ? true : false>;
