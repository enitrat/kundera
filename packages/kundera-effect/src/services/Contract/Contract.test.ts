import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import { ContractLayer } from "./Contract.js";
import { ContractFactory } from "./ContractFactory.js";
import { ContractService } from "./ContractService.js";
import { ContractWriteService } from "../ContractWrite/ContractWriteService.js";
import type { Abi } from "@kundera-sn/kundera-ts/abi";
import * as ContractAddress from "../../primitives/ContractAddress/index.js";

const ERC20_ABI: Abi = [
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" }
    ]
  },
  {
    type: "function",
    name: "balance_of",
    inputs: [
      { name: "account", type: "core::starknet::contract_address::ContractAddress" }
    ],
    outputs: [{ name: "balance", type: "core::integer::u256" }],
    state_mutability: "view"
  }
];

describe("ContractService", () => {
  it("readContract decodes output", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: ({ method }: { method: string }) => {
        if (method === "starknet_call") {
          return Effect.succeed(["0x2", "0x0"]);
        }
        return Effect.fail(new Error("unexpected"));
      }
    });

    const program = Effect.gen(function* () {
      const contract = yield* ContractService;
      return yield* contract.readContract({
        abi: ERC20_ABI,
        address: "0x123",
        functionName: "balance_of",
        args: ["0xabc"],
        blockId: "latest"
      });
    }).pipe(Effect.provide(ContractLayer), Effect.provide(providerLayer));

    const result = await Effect.runPromise(program);
    expect(result.balance).toBeDefined();
  });
});

describe("ContractFactory", () => {
  const ERC20_ABI_TYPED = [
    {
      type: "struct",
      name: "core::integer::u256",
      members: [
        { name: "low", type: "core::integer::u128" },
        { name: "high", type: "core::integer::u128" }
      ]
    },
    {
      type: "function",
      name: "balance_of",
      inputs: [
        { name: "account", type: "core::starknet::contract_address::ContractAddress" }
      ],
      outputs: [{ name: "balance", type: "core::integer::u256" }],
      state_mutability: "view"
    },
    {
      type: "function",
      name: "transfer",
      inputs: [
        { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
        { name: "amount", type: "core::integer::u256" }
      ],
      outputs: [],
      state_mutability: "external"
    }
  ] as const;

  it("builds typed read methods", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: ({ method }: { method: string }) => {
        if (method === "starknet_call") {
          return Effect.succeed(["0x2", "0x0"]);
        }
        return Effect.fail(new Error("unexpected"));
      }
    });

    const program = Effect.gen(function* () {
      const address = yield* ContractAddress.from("0x123");
      const token = yield* ContractFactory(address, ERC20_ABI_TYPED);
      const owner = yield* ContractAddress.from("0xabc");
      return yield* token.read.balance_of(owner);
    }).pipe(Effect.provide(ContractLayer), Effect.provide(providerLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
  });

  it("requires write options", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: ({ method }: { method: string }) => {
        if (method === "starknet_call") {
          return Effect.succeed(["0x2", "0x0"]);
        }
        return Effect.fail(new Error("unexpected"));
      }
    });

    const contractWriteLayer = Layer.succeed(ContractWriteService, {
      buildCall: () => Effect.die("unexpected"),
      invoke: () => Effect.die("unexpected"),
      writeContract: () => Effect.die("unexpected")
    });

    const program = Effect.gen(function* () {
      const address = yield* ContractAddress.from("0x123");
      const token = yield* ContractFactory(address, ERC20_ABI_TYPED);
      const recipient = yield* ContractAddress.from("0xabc");
      return yield* token.write.transfer(recipient, 10n);
    }).pipe(
      Effect.provide(ContractLayer),
      Effect.provide(providerLayer),
      Effect.provide(contractWriteLayer)
    );

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ContractWriteError");
    }
  });
});
