import { Presets } from "@kundera-sn/kundera-effect";

export type Network = "mainnet" | "sepolia";

export const TOKENS: Record<"ETH" | "STRK", string> = {
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
};

export function parseNetwork(value: string): Network {
  if (value === "mainnet" || value === "sepolia") {
    return value;
  }
  throw new Error(`Unknown network: ${value}. Use mainnet or sepolia.`);
}

export function getProviderLayer(network: Network) {
  const envUrl = process.env.STARKNET_RPC_URL;
  if (envUrl) {
    return Presets.createProvider(envUrl, { timeout: 30_000 });
  }
  return network === "mainnet"
    ? Presets.MainnetProvider({ timeout: 30_000 })
    : Presets.SepoliaProvider({ timeout: 30_000 });
}

export const ERC20_ABI = [
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;
