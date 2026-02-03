/**
 * kdex configuration
 *
 * Shared configuration for RPC transport.
 */

import { httpTransport } from "@kundera-sn/kundera-effect/transport";

// Default RPC URLs for different networks
const RPC_URLS = {
  mainnet: "https://api.zan.top/public/starknet-mainnet",
  sepolia: "https://api.zan.top/public/starknet-sepolia",
} as const;

export type Network = keyof typeof RPC_URLS;

/**
 * Get the RPC URL for a network
 */
export function getRpcUrl(network: Network): string {
  return process.env.STARKNET_RPC_URL ?? RPC_URLS[network];
}

/**
 * Create a transport for the specified network
 */
export function createTransport(network: Network = "mainnet") {
  const url = getRpcUrl(network);
  return httpTransport(url);
}
