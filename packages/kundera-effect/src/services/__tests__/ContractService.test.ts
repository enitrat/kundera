import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ContractAddress } from "@kundera-sn/kundera-ts";
import type { Abi } from "@kundera-sn/kundera-ts/abi";

import { ContractLive, ContractService } from "../ContractService.js";
import { ProviderService } from "../ProviderService.js";

const ERC20_ABI: Abi = [
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

describe("ContractService", () => {
  it.effect("encodes, calls provider, and decodes output", () => {
    let requestArgs: { method: string; params?: readonly unknown[] } | undefined;
    const contractAddress = ContractAddress.from("0x1234");

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        requestArgs = { method, params };
        return Effect.succeed(["0x2a", "0x0"] as T);
      },
    });

    const program = Effect.flatMap(ContractService, (contracts) =>
      contracts.call({
        contractAddress,
        abi: ERC20_ABI,
        functionName: "balance_of",
        args: [0xabcn],
      }),
    ).pipe(Effect.provide(ContractLive), Effect.provide(providerLayer));

    return Effect.gen(function* () {
      const result = yield* program;

      expect(result).toBe(42n);
      expect(requestArgs?.method).toBe("starknet_call");
      expect(requestArgs?.params?.[1]).toBe("latest");
      const requestPayload = requestArgs?.params?.[0] as
        | { contract_address?: string }
        | undefined;
      expect(requestPayload?.contract_address).toBe(contractAddress.toHex());
    });
  });

  it.effect("supports bound contract factory via at()", () => {
    const contractAddress = ContractAddress.from("0x999");
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed(["0x7", "0x0"] as T),
    });

    const program = Effect.flatMap(ContractService, (contracts) => {
      const token = contracts.at(contractAddress, ERC20_ABI);
      return token.read("balance_of", [0xabcn]);
    }).pipe(Effect.provide(ContractLive), Effect.provide(providerLayer));

    return Effect.gen(function* () {
      const result = yield* program;
      expect(result).toBe(7n);
    });
  });

  it.effect("fails with ContractError on invalid function name", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed([] as T),
    });

    const program = Effect.flatMap(ContractService, (contracts) =>
      Effect.either(
        contracts.call({
          contractAddress: ContractAddress.from("0x1234"),
          abi: ERC20_ABI,
          functionName: "missing_function" as never,
          args: [],
        }),
      ),
    ).pipe(Effect.provide(ContractLive), Effect.provide(providerLayer));

    return Effect.gen(function* () {
      const result = yield* program;
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("ContractError");
        expect(result.left.stage).toBe("encode");
      }
    });
  });
});
