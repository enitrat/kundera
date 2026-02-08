import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ContractAddress } from "@kundera-sn/kundera-ts";
import type { Abi } from "@kundera-sn/kundera-ts/abi";

import {
  ContractLive,
  ContractService,
  readContract,
  simulateContract,
} from "../ContractService.js";
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

describe("readContract", () => {
  it.effect("reads contract without Contract instance", () => {
    let capturedMethod: string | undefined;
    const contractAddress = ContractAddress.from("0x5678");

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, _params?: readonly unknown[]) => {
        capturedMethod = method;
        return Effect.succeed(["0x64", "0x0"] as T);
      },
    });

    const program = readContract({
      contractAddress,
      abi: ERC20_ABI,
      functionName: "balance_of",
      args: [0xabcn],
    }).pipe(Effect.provide(ContractLive), Effect.provide(providerLayer));

    return Effect.gen(function* () {
      const result = yield* program;
      expect(result).toBe(100n);
      expect(capturedMethod).toBe("starknet_call");
    });
  });

  it.effect("accepts blockId option", () => {
    let capturedParams: readonly unknown[] | undefined;
    const contractAddress = ContractAddress.from("0xaaa");

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(_method: string, params?: readonly unknown[]) => {
        capturedParams = params;
        return Effect.succeed(["0x1", "0x0"] as T);
      },
    });

    const program = readContract({
      contractAddress,
      abi: ERC20_ABI,
      functionName: "balance_of",
      args: [0x1n],
      blockId: { block_number: 100 },
    }).pipe(Effect.provide(ContractLive), Effect.provide(providerLayer));

    return Effect.gen(function* () {
      yield* program;
      expect(capturedParams?.[1]).toEqual({ block_number: 100 });
    });
  });

  it.effect("fails with ContractError on invalid function", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed([] as T),
    });

    const program = Effect.either(
      readContract({
        contractAddress: ContractAddress.from("0x1"),
        abi: ERC20_ABI,
        functionName: "nonexistent" as never,
        args: [],
      }),
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

describe("simulateContract", () => {
  it.effect("encodes calldata and calls starknet_simulateTransactions", () => {
    let capturedMethod: string | undefined;
    let capturedParams: readonly unknown[] | undefined;
    const contractAddress = ContractAddress.from("0xdeadbeef");

    const mockSimulationResult = [
      {
        transaction_trace: { type: "INVOKE" },
        fee_estimation: {
          gas_consumed: "0x100",
          gas_price: "0x1",
          overall_fee: "0x100",
          unit: "WEI",
        },
      },
    ];

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        capturedMethod = method;
        capturedParams = params;
        return Effect.succeed(mockSimulationResult as T);
      },
    });

    const program = simulateContract({
      contractAddress,
      abi: ERC20_ABI,
      functionName: "balance_of",
      args: [0xabcn],
    }).pipe(Effect.provide(providerLayer));

    return Effect.gen(function* () {
      const result = yield* program;

      expect(capturedMethod).toBe("starknet_simulateTransactions");
      expect(result.transactionTrace).toEqual({ type: "INVOKE" });
      expect(result.feeEstimation.gas_consumed).toBe("0x100");

      // Verify simulation flags default to SKIP_VALIDATE + SKIP_FEE_CHARGE
      const rpcParams = capturedParams as unknown[];
      const flags = rpcParams?.[2] as string[];
      expect(flags).toContain("SKIP_VALIDATE");
      expect(flags).toContain("SKIP_FEE_CHARGE");

      // Verify the transaction was built with the correct contract address
      const txs = rpcParams?.[1] as Array<{ sender_address: string }>;
      expect(txs?.[0]?.sender_address).toBe(contractAddress.toHex());
    });
  });

  it.effect("passes custom simulation flags and blockId", () => {
    let capturedParams: readonly unknown[] | undefined;
    const contractAddress = ContractAddress.from("0xfeed");

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(_method: string, params?: readonly unknown[]) => {
        capturedParams = params;
        return Effect.succeed([
          {
            transaction_trace: { type: "INVOKE" },
            fee_estimation: { gas_consumed: "0x0", gas_price: "0x0", overall_fee: "0x0", unit: "WEI" },
          },
        ] as T);
      },
    });

    const program = simulateContract({
      contractAddress,
      abi: ERC20_ABI,
      functionName: "balance_of",
      args: [0x1n],
      blockId: { block_number: 500 },
      simulationFlags: ["SKIP_VALIDATE"],
    }).pipe(Effect.provide(providerLayer));

    return Effect.gen(function* () {
      yield* program;

      const rpcParams = capturedParams as unknown[];
      // blockId is first param
      expect(rpcParams?.[0]).toEqual({ block_number: 500 });
      // Only SKIP_VALIDATE, not SKIP_FEE_CHARGE
      const flags = rpcParams?.[2] as string[];
      expect(flags).toEqual(["SKIP_VALIDATE"]);
    });
  });

  it.effect("fails with ContractError on ABI encode failure", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed([] as T),
    });

    const program = Effect.either(
      simulateContract({
        contractAddress: ContractAddress.from("0x1"),
        abi: ERC20_ABI,
        functionName: "nonexistent" as never,
        args: [],
      }),
    ).pipe(Effect.provide(providerLayer));

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
