import { Effect } from "effect";
import type { ContractAddressType } from "@kundera-sn/kundera-ts";
import type { AbiLike } from "@kundera-sn/kundera-ts/abi";

import { ContractService, type ContractInstance } from "./ContractService.js";

export interface ContractDefinition<TAbi extends AbiLike = AbiLike> {
  readonly address: ContractAddressType;
  readonly abi: TAbi;
}

export type ContractRegistryConfig = Record<string, ContractDefinition>;

export type InferContractRegistry<TConfig extends ContractRegistryConfig> = {
  readonly [K in keyof TConfig]: ContractInstance<TConfig[K]["abi"]>;
};

export interface ContractRegistry<TConfig extends ContractRegistryConfig> {
  readonly contracts: InferContractRegistry<TConfig>;
  readonly get: <K extends keyof TConfig>(name: K) => InferContractRegistry<TConfig>[K];
}

/**
 * Creates a type-safe contract registry from config.
 *
 * This is intentionally an Effect-returning function instead of a Context.Tag
 * service because the registry shape is generic per call site (`TConfig`).
 */
export const makeContractRegistry = <TConfig extends ContractRegistryConfig>(
  config: TConfig,
): Effect.Effect<ContractRegistry<TConfig>, never, ContractService> =>
  Effect.map(ContractService, (service) => {
    // TypeScript cannot preserve key-specific mapped types through Object.keys iteration.
    const contracts = {} as {
      -readonly [K in keyof TConfig]: ContractInstance<TConfig[K]["abi"]>;
    };

    for (const key of Object.keys(config) as Array<keyof TConfig>) {
      const def = config[key];
      // TS cannot correlate `key` to the mapped ABI member at this point.
      contracts[key] = service.at(def.address, def.abi as TConfig[typeof key]["abi"]);
    }

    return {
      // Safe because `contracts` is populated using every key from `config`.
      contracts: contracts as InferContractRegistry<TConfig>,
      get: (name) => contracts[name],
    };
  });
