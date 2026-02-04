/**
 * kdex configuration
 *
 * Configuration and services using Effect's service pattern.
 * Uses Config for validated configuration and Effect.Service for DI.
 */

import { Config, Context, Effect, Layer, Schema } from "effect";
import { httpTransport } from "@kundera-sn/kundera-effect/transport";
import type { Transport } from "@kundera-sn/kundera-ts/transport";
import { ConfigurationError } from "./errors.js";

// -----------------------------------------------------------------------------
// Branded Types
// -----------------------------------------------------------------------------

/**
 * Branded RPC URL type for type safety
 */
export const RpcUrl = Schema.String.pipe(
  Schema.pattern(/^https?:\/\/.+/),
  Schema.brand("@kdex/RpcUrl")
);
export type RpcUrl = Schema.Schema.Type<typeof RpcUrl>;

// -----------------------------------------------------------------------------
// Network Configuration
// -----------------------------------------------------------------------------

const RPC_URLS = {
  mainnet: "https://api.zan.top/public/starknet-mainnet",
  sepolia: "https://api.zan.top/public/starknet-sepolia",
} as const;

export type Network = keyof typeof RPC_URLS;

export const NETWORKS = Object.keys(RPC_URLS) as Network[];

/**
 * Validate network string
 */
export const isValidNetwork = (network: string): network is Network =>
  network in RPC_URLS;

// -----------------------------------------------------------------------------
// Token Configuration
// -----------------------------------------------------------------------------

export const TOKEN_ADDRESSES = {
  mainnet: {
    ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  },
  sepolia: {
    ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  },
} as const;

export type Token = keyof (typeof TOKEN_ADDRESSES)["mainnet"];

export const TOKENS = ["ETH", "STRK"] as const;

// -----------------------------------------------------------------------------
// Effect Config
// -----------------------------------------------------------------------------

/**
 * RPC URL config - reads from STARKNET_RPC_URL env var with network-specific fallback
 */
export const RpcUrlConfig = (network: Network) =>
  Config.string("STARKNET_RPC_URL").pipe(
    Config.withDefault(RPC_URLS[network]),
    Config.validate({
      message: "RPC URL must be a valid HTTP(S) URL",
      validation: (url) => /^https?:\/\/.+/.test(url),
    })
  );

// -----------------------------------------------------------------------------
// Transport Service
// -----------------------------------------------------------------------------

/**
 * Transport service for dependency injection.
 *
 * Note: We use Context.Tag here because Transport is infrastructure with
 * runtime injection (provided externally), not business logic.
 */
export class TransportService extends Context.Tag("@kdex/TransportService")<
  TransportService,
  Transport
>() {}

/**
 * Create transport layer for a network.
 * Config errors are surfaced as ConfigurationError.
 */
export const TransportLayer = (network: Network): Layer.Layer<TransportService, ConfigurationError> =>
  Layer.effect(
    TransportService,
    Effect.gen(function* () {
      const url = yield* RpcUrlConfig(network).pipe(
        Effect.mapError(
          (error) =>
            new ConfigurationError({
              key: "STARKNET_RPC_URL",
              message: `Invalid RPC configuration: ${error.message}`,
            })
        )
      );
      return httpTransport(url);
    })
  );

/**
 * Create transport layer that dies on config error (for CLI usage where
 * config errors should be fatal)
 */
export const TransportLayerOrDie = (network: Network): Layer.Layer<TransportService> =>
  Layer.effect(
    TransportService,
    Effect.gen(function* () {
      const url = yield* RpcUrlConfig(network);
      return httpTransport(url);
    }).pipe(Effect.orDie)
  );
