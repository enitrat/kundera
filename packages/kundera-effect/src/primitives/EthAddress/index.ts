import {
  EthAddress,
  type EthAddressType,
  MAX_ETH_ADDRESS
} from "kundera-sn/EthAddress";
import type { Felt252Input } from "kundera-sn/Felt252";
import { tryPrimitive } from "../utils.js";

export type { EthAddressType } from "kundera-sn/EthAddress";
export { MAX_ETH_ADDRESS } from "kundera-sn/EthAddress";

export { EthAddress } from "kundera-sn/EthAddress";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "EthAddress.from",
    value,
    "felt < 2^160",
    () => EthAddress(value)
  );
