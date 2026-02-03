/**
 * kdex balance command
 *
 * Get STRK or ETH balance of an address.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import * as Abi from "@kundera-sn/kundera-effect/abi";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import { TransportTag, type Network } from "../config.js";

// Token addresses on Starknet mainnet
const TOKEN_ADDRESSES = {
  mainnet: {
    ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  },
  sepolia: {
    ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  },
} as const;

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;

export type Token = "ETH" | "STRK";

function formatBalance(value: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  // Show only first 6 decimal places
  const truncatedFractional = fractionalStr.slice(0, 6).replace(/0+$/, "") || "0";

  return `${integerPart}.${truncatedFractional}`;
}

export const balance = (address: string, token: Token, network: Network) =>
  Effect.gen(function* () {
    const transport = yield* TransportTag;
    const tokenAddress = TOKEN_ADDRESSES[network][token];

    // Validate and create the contract address
    const accountAddress = yield* ContractAddress.from(address);

    // Encode the calldata using ABI encoding
    const encodeResult = yield* Abi.encodeCalldata(ERC20_ABI, "balanceOf", [accountAddress.toHex()]);

    // Get function selector
    const selector = yield* Abi.getFunctionSelectorHex("balanceOf");

    // Make the call
    const result = yield* Rpc.starknet_call(
      transport,
      {
        contract_address: tokenAddress,
        entry_point_selector: selector,
        calldata: encodeResult.map(f => `0x${f.toString(16)}`),
      },
      "latest"
    );

    // Decode the result (u256 = low + high * 2^128)
    const low = BigInt(result[0]);
    const high = BigInt(result[1]);
    const balanceValue = low + (high << 128n);

    // Format with decimals (18 decimals for both ETH and STRK)
    const formatted = formatBalance(balanceValue, 18);
    yield* Effect.log(`${formatted} ${token}`);

    return balanceValue;
  });
