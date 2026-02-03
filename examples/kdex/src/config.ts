/**
 * kdex configuration
 *
 * Shared configuration for RPC transport using Effect Config.
 */

import { Config, ConfigProvider, Effect, Layer } from "effect";
import { httpTransport } from "@kundera-sn/kundera-effect/transport";
import type { Transport } from "@kundera-sn/kundera-ts/transport";

// Default RPC URLs for different networks
const RPC_URLS = {
  mainnet: "https://api.zan.top/public/starknet-mainnet",
  sepolia: "https://api.zan.top/public/starknet-sepolia",
} as const;

export type Network = keyof typeof RPC_URLS;

/**
 * Effect Config for RPC URL - reads from STARKNET_RPC_URL env var
 * with fallback to network-specific defaults
 */
export const RpcUrlConfig = (network: Network) =>
  Config.string("STARKNET_RPC_URL").pipe(
    Config.withDefault(RPC_URLS[network])
  );

/**
 * Create a transport for the specified network (effectful)
 */
export const createTransportEffect = (network: Network) =>
  Effect.gen(function* () {
    const url = yield* RpcUrlConfig(network);
    return httpTransport(url);
  });

/**
 * Create a transport Layer for the specified network
 * Config errors are converted to defects (they indicate misconfiguration)
 */
export const TransportLayer = (network: Network) =>
  Layer.effect(
    TransportTag,
    createTransportEffect(network).pipe(Effect.orDie)
  );

/**
 * Transport service tag for dependency injection
 */
import * as Context from "effect/Context";

export class TransportTag extends Context.Tag("kdex/Transport")<
  TransportTag,
  Transport
>() {}

/**
 * Config provider that reads from process.env
 */
export const EnvConfigProvider = ConfigProvider.fromEnv();
