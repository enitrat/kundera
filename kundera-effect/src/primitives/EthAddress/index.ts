import {
  EthAddress,
  type EthAddressType,
  type Felt252Input,
  MAX_ETH_ADDRESS
} from "@starknet/kundera/primitives";
import { tryPrimitive } from "../utils.js";

export type { EthAddressType } from "@starknet/kundera/primitives";
export { MAX_ETH_ADDRESS } from "@starknet/kundera/primitives";

export { EthAddress } from "@starknet/kundera/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "EthAddress.from",
    value,
    "felt < 2^160",
    () => EthAddress(value)
  );
