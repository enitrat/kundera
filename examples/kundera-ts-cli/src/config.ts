import { HttpProvider } from "@kundera-sn/kundera-ts/provider";

// FEEDBACK: Docs don't list any public RPC URLs. Had to guess/know common ones.
// The transport guide mentions "https://api.zan.top/public/starknet-sepolia" in an example.
const RPC_URLS: Record<string, string> = {
  mainnet: "https://api.zan.top/public/starknet-mainnet",
  sepolia: "https://api.zan.top/public/starknet-sepolia",
};

export type Network = "mainnet" | "sepolia";

export function getProvider(network: Network): HttpProvider {
  const url = process.env.STARKNET_RPC_URL ?? RPC_URLS[network];
  if (!url) {
    throw new Error(`Unknown network: ${network}. Use mainnet or sepolia.`);
  }
  // FEEDBACK: Provider API doc shows `new HttpProvider({ url })` but
  // domain-primitives doc shows `new HttpProvider('url')` (string).
  // Going with the options object form from Provider API.
  return new HttpProvider({ url, timeout: 30_000, retry: 2, retryDelay: 500 });
}

// Well-known token addresses on Starknet mainnet
export const TOKENS: Record<string, string> = {
  ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
};
