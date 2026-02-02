import {
  EthAddress,
  type EthAddressType,
  type Felt252Input,
  MAX_ETH_ADDRESS
} from "kundera-sn/primitives";
import { tryPrimitive } from "../utils.js";

export type { EthAddressType } from "kundera-sn/primitives";
export { MAX_ETH_ADDRESS } from "kundera-sn/primitives";

export { EthAddress } from "kundera-sn/primitives";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "EthAddress.from",
    value,
    "felt < 2^160",
    () => EthAddress(value)
  );
