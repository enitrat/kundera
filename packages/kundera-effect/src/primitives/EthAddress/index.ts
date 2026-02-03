import {
  EthAddress,
  type EthAddressType,
  MAX_ETH_ADDRESS
} from "@kundera-sn/kundera-ts/EthAddress";
import type { Felt252Input } from "@kundera-sn/kundera-ts/Felt252";
import { tryPrimitive } from "../utils.js";

export type { EthAddressType } from "@kundera-sn/kundera-ts/EthAddress";
export { MAX_ETH_ADDRESS } from "@kundera-sn/kundera-ts/EthAddress";

export { EthAddress } from "@kundera-sn/kundera-ts/EthAddress";

export const from = (value: Felt252Input) =>
  tryPrimitive(
    "EthAddress.from",
    value,
    "felt < 2^160",
    () => EthAddress(value)
  );
