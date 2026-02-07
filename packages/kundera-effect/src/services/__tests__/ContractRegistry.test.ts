import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ContractAddress } from "@kundera-sn/kundera-ts";
import type { Abi } from "@kundera-sn/kundera-ts/abi";

import { ContractLive } from "../ContractService.js";
import { makeContractRegistry } from "../ContractRegistry.js";
import { ProviderService } from "../ProviderService.js";

const BALANCE_ABI: Abi = [
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
];

describe("ContractRegistry", () => {
  it.effect("builds typed contract instances from config", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed(["0x64", "0x0"] as T),
    });

    return Effect.gen(function* () {
      const registry = yield* makeContractRegistry({
        token: {
          address: ContractAddress.from("0x111"),
          abi: BALANCE_ABI,
        },
        treasury: {
          address: ContractAddress.from("0x222"),
          abi: BALANCE_ABI,
        },
      });

      const tokenBalance = yield* registry.get("token").read("balance_of", [0xabcn]);
      const treasuryBalance = yield* registry.contracts.treasury.read("balance_of", [0xabcn]);

      expect(tokenBalance).toBe(100n);
      expect(treasuryBalance).toBe(100n);
    }).pipe(Effect.provide(ContractLive), Effect.provide(providerLayer));
  });

  it.effect("delegates ContractInstance.read through ContractService.call with key-specific address", () => {
    let calledParams: readonly unknown[] | undefined;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(_method: string, params?: readonly unknown[]) => {
        calledParams = params;
        return Effect.succeed(["0x1", "0x0"] as T);
      },
    });

    return Effect.gen(function* () {
      const registry = yield* makeContractRegistry({
        token: {
          address: ContractAddress.from("0x111"),
          abi: BALANCE_ABI,
        },
      });
      yield* registry.get("token").read("balance_of", [0xabcn]);

      const requestPayload = calledParams?.[0] as
        | { contract_address?: string }
        | undefined;
      expect(requestPayload?.contract_address).toBe(ContractAddress.from("0x111").toHex());
      expect(calledParams?.[1]).toBe("latest");
    }).pipe(Effect.provide(ContractLive), Effect.provide(providerLayer));
  });
});
