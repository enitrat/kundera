import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import { ContractLayer } from "./Contract.js";
import {
  ContractRegistryService,
  makeContractRegistry,
  type ContractInstanceFactory,
  type InferContractRegistry,
} from "./ContractRegistryService.js";
import type { ContractInstance } from "./ContractTypes.js";

const ERC20_ABI = [
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
    name: "balance_of",
    inputs: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [{ name: "balance", type: "core::integer::u256" }],
    state_mutability: "view",
  },
] as const;

const MOCK_PROVIDER = Layer.succeed(ProviderService, {
  request: ({ method }: { method: string }) => {
    if (method === "starknet_call") {
      return Effect.succeed(["0x2", "0x0"]);
    }
    return Effect.fail(new Error("unexpected"));
  },
});

describe("ContractRegistryService", () => {
  describe("makeContractRegistry", () => {
    it("creates ContractInstance for pre-addressed contracts", async () => {
      const ContractsLayer = makeContractRegistry({
        ETH: {
          abi: ERC20_ABI,
          address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        },
      });

      const program = Effect.gen(function* () {
        const registry = yield* ContractRegistryService;
        const eth = registry["ETH"] as ContractInstance<typeof ERC20_ABI>;

        // Verify it's a full contract instance
        expect(eth.address).toBe(
          "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
        );
        expect(eth.abi).toBe(ERC20_ABI);
        expect(typeof eth.read.balance_of).toBe("function");

        // Call the method
        const balance = yield* eth.read.balance_of("0xabc");
        return balance;
      }).pipe(
        Effect.provide(ContractsLayer),
        Effect.provide(ContractLayer),
        Effect.provide(MOCK_PROVIDER)
      );

      const result = await Effect.runPromise(program);
      expect(result).toBeDefined();
    });

    it("creates ContractInstanceFactory for contracts without address", async () => {
      const ContractsLayer = makeContractRegistry({
        ERC20: {
          abi: ERC20_ABI,
        },
      });

      const program = Effect.gen(function* () {
        const registry = yield* ContractRegistryService;
        const erc20Factory = registry["ERC20"] as ContractInstanceFactory<
          typeof ERC20_ABI
        >;

        // Verify it's a factory
        expect(erc20Factory.abi).toBe(ERC20_ABI);
        expect(typeof erc20Factory.at).toBe("function");
        expect((erc20Factory as unknown as { address?: string }).address).toBeUndefined();

        // Create instance at runtime address
        const token = erc20Factory.at("0x123");
        expect(token.address).toBe("0x123");
        expect(typeof token.read.balance_of).toBe("function");

        // Call the method
        const balance = yield* token.read.balance_of("0xabc");
        return balance;
      }).pipe(
        Effect.provide(ContractsLayer),
        Effect.provide(ContractLayer),
        Effect.provide(MOCK_PROVIDER)
      );

      const result = await Effect.runPromise(program);
      expect(result).toBeDefined();
    });

    it("supports mixed configuration", async () => {
      const ContractsLayer = makeContractRegistry({
        ETH: {
          abi: ERC20_ABI,
          address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
        },
        STRK: {
          abi: ERC20_ABI,
          address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
        },
        ERC20: {
          abi: ERC20_ABI,
        },
      });

      const program = Effect.gen(function* () {
        const registry = yield* ContractRegistryService;

        // Pre-addressed contracts
        const eth = registry["ETH"] as ContractInstance<typeof ERC20_ABI>;
        const strk = registry["STRK"] as ContractInstance<typeof ERC20_ABI>;

        expect(eth.address).toBe(
          "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
        );
        expect(strk.address).toBe(
          "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
        );

        // Factory
        const erc20Factory = registry["ERC20"] as ContractInstanceFactory<
          typeof ERC20_ABI
        >;
        const customToken = erc20Factory.at("0x999");
        expect(customToken.address).toBe("0x999");

        // Call methods
        const ethBalance = yield* eth.read.balance_of("0xabc");
        const strkBalance = yield* strk.read.balance_of("0xabc");
        const customBalance = yield* customToken.read.balance_of("0xabc");

        return { ethBalance, strkBalance, customBalance };
      }).pipe(
        Effect.provide(ContractsLayer),
        Effect.provide(ContractLayer),
        Effect.provide(MOCK_PROVIDER)
      );

      const result = await Effect.runPromise(program);
      expect(result.ethBalance).toBeDefined();
      expect(result.strkBalance).toBeDefined();
      expect(result.customBalance).toBeDefined();
    });
  });

  describe("InferContractRegistry type helper", () => {
    it("correctly types the registry shape", () => {
      const config = {
        ETH: {
          abi: ERC20_ABI,
          address: "0x123" as const,
        },
        ERC20: {
          abi: ERC20_ABI,
        },
      } as const;

      type Registry = InferContractRegistry<typeof config>;

      // Type-level test: these should compile
      const _typeTest: Registry = {} as Registry;
      const _eth: ContractInstance<typeof ERC20_ABI> = _typeTest.ETH;
      const _erc20: ContractInstanceFactory<typeof ERC20_ABI> = _typeTest.ERC20;

      // Suppress unused variable warnings
      expect(_eth).toBeDefined;
      expect(_erc20).toBeDefined;
    });
  });
});
