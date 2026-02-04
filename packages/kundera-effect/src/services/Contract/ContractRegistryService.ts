/**
 * ContractRegistryService - Pre-configured contract instances in a Layer
 *
 * This service enables defining contracts upfront and accessing them via a registry,
 * providing cleaner Effect composition without nested yields for contract creation.
 *
 * @example
 * ```typescript
 * // Define contracts in a registry
 * const Contracts = makeContractRegistry({
 *   ETH: { abi: ERC20_ABI, address: '0x049d...' },
 *   STRK: { abi: ERC20_ABI, address: '0x047...' },
 *   ERC20: { abi: ERC20_ABI }, // factory - no address
 * });
 *
 * // Use in Effect.gen - no nested yields
 * const program = Effect.gen(function* () {
 *   const { ETH, STRK, ERC20 } = yield* ContractRegistryService;
 *
 *   // Pre-addressed: use directly
 *   const ethBalance = yield* ETH.read.balanceOf(user);
 *
 *   // Factory: create at runtime
 *   const token = ERC20.at(dynamicAddress);
 *   const balance = yield* token.read.balanceOf(user);
 * }).pipe(Effect.provide(Contracts));
 * ```
 */

import { Context, Effect, Layer } from "effect";
import type { ContractAddressType } from "@kundera-sn/kundera-ts/ContractAddress";
import { ContractFactory } from "./ContractFactory.js";
import type { ContractInstance, StarknetAbi } from "./ContractTypes.js";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Definition for a single contract in the registry.
 * If `address` is provided, creates a full ContractInstance.
 * If `address` is omitted, creates a ContractInstanceFactory with `.at()` method.
 */
export interface ContractDef<TAbi extends StarknetAbi> {
  readonly abi: TAbi;
  readonly address?: ContractAddressType | string;
}

/**
 * Configuration map for the registry.
 * Keys are contract names, values are ContractDef configurations.
 */
export type ContractRegistryConfig = Record<string, ContractDef<StarknetAbi>>;

/**
 * Factory interface for contracts without pre-defined addresses.
 * Provides an `.at()` method to create instances at runtime.
 */
export interface ContractInstanceFactory<TAbi extends StarknetAbi> {
  readonly abi: TAbi;
  /**
   * Create a contract instance at the given address
   */
  readonly at: (address: ContractAddressType | string) => ContractInstance<TAbi>;
}

/**
 * Maps a contract definition to either a full instance or a factory.
 * - With address: ContractInstance<TAbi>
 * - Without address: ContractInstanceFactory<TAbi>
 */
export type ContractRegistryShape<TConfig extends ContractRegistryConfig> = {
  readonly [K in keyof TConfig]: TConfig[K]["address"] extends
    | ContractAddressType
    | string
    ? ContractInstance<TConfig[K]["abi"]>
    : ContractInstanceFactory<TConfig[K]["abi"]>;
};

/**
 * Base type for the registry (used internally for dynamic construction)
 */
type ContractRegistryBase = Record<
  string,
  ContractInstance<StarknetAbi> | ContractInstanceFactory<StarknetAbi>
>;

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

/**
 * ContractRegistryService - Context.Tag for accessing the contract registry.
 *
 * The registry contains pre-configured contract instances and factories
 * for cleaner Effect composition.
 */
export class ContractRegistryService extends Context.Tag(
  "@kundera-effect/ContractRegistryService"
)<ContractRegistryService, ContractRegistryBase>() {}

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

/**
 * Create a contract registry Layer from configuration.
 *
 * This function takes a configuration object where each key maps to either:
 * - A full ContractInstance (when address is provided)
 * - A ContractInstanceFactory with `.at()` method (when address is omitted)
 *
 * @param config - Contract definitions with ABIs and optional addresses
 * @returns Layer providing ContractRegistryService
 *
 * @example
 * ```typescript
 * const ContractsLayer = makeContractRegistry({
 *   // Pre-addressed: creates ContractInstance directly
 *   ETH: {
 *     abi: ERC20_ABI,
 *     address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
 *   },
 *   // Factory: creates ContractInstanceFactory with .at() method
 *   ERC20: {
 *     abi: ERC20_ABI,
 *   },
 * });
 * ```
 */
export const makeContractRegistry = <const TConfig extends ContractRegistryConfig>(
  config: TConfig
): Layer.Layer<ContractRegistryService> =>
  Layer.succeed(
    ContractRegistryService,
    (() => {
      const registry: ContractRegistryBase = {};

      for (const [name, contractDef] of Object.entries(config)) {
        if (contractDef.address !== undefined) {
          // Pre-addressed: create full instance synchronously
          // ContractFactory returns Effect.succeed(), so Effect.runSync is safe
          registry[name] = Effect.runSync(
            ContractFactory(contractDef.address, contractDef.abi)
          );
        } else {
          // No address: create factory with .at() method
          registry[name] = {
            abi: contractDef.abi,
            at: (address: ContractAddressType | string) =>
              Effect.runSync(ContractFactory(address, contractDef.abi)),
          } satisfies ContractInstanceFactory<typeof contractDef.abi>;
        }
      }

      return registry;
    })()
  );

// -----------------------------------------------------------------------------
// Type Helpers
// -----------------------------------------------------------------------------

/**
 * Infer the registry shape from a configuration type.
 * Useful for typing the yielded value from ContractRegistryService.
 *
 * @example
 * ```typescript
 * const contractsConfig = {
 *   ETH: { abi: ERC20_ABI, address: '0x...' },
 *   ERC20: { abi: ERC20_ABI },
 * } as const;
 *
 * type Contracts = InferContractRegistry<typeof contractsConfig>;
 * // { ETH: ContractInstance<...>, ERC20: ContractInstanceFactory<...> }
 * ```
 */
export type InferContractRegistry<TConfig extends ContractRegistryConfig> =
  ContractRegistryShape<TConfig>;
