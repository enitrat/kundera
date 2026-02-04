/**
 * kdex configuration
 *
 * Configuration and services using Effect's service pattern.
 * Uses Config for validated configuration and Effect.Service for DI.
 */

import { Config, Context, Effect, Layer, Schema } from "effect";
import { httpTransport } from "@kundera-sn/kundera-effect/transport";
import type { Transport } from "@kundera-sn/kundera-ts/transport";
import { Services } from "@kundera-sn/kundera-effect";
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

// -----------------------------------------------------------------------------
// ERC20 ABI
// -----------------------------------------------------------------------------

/**
 * Minimal ERC20 ABI for balance queries.
 * The `as const` assertion enables abi-wan-kanabi type inference.
 */
export const ERC20_ABI = [
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
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "core::integer::u8" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "core::felt252" }],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "core::felt252" }],
    state_mutability: "view",
  },
] as const;

// -----------------------------------------------------------------------------
// Contract Registry Layer
// -----------------------------------------------------------------------------

/**
 * Create a contract registry layer for a specific network.
 *
 * Pre-configures ETH and STRK token contracts, plus an ERC20 factory
 * for dynamic token addresses.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const { ETH, STRK, ERC20 } = yield* Services.Contract.ContractRegistryService;
 *
 *   // Pre-addressed: use directly
 *   const ethBalance = yield* ETH.read.balanceOf(user);
 *
 *   // Factory: create at runtime
 *   const token = ERC20.at(dynamicAddress);
 *   const balance = yield* token.read.balanceOf(user);
 * }).pipe(Effect.provide(ContractsLayer("mainnet")));
 * ```
 */
export const ContractsLayer = (network: Network) =>
  Services.Contract.makeContractRegistry({
    ETH: {
      abi: ERC20_ABI,
      address: TOKEN_ADDRESSES[network].ETH,
    },
    STRK: {
      abi: ERC20_ABI,
      address: TOKEN_ADDRESSES[network].STRK,
    },
    ERC20: {
      abi: ERC20_ABI,
    },
  });
