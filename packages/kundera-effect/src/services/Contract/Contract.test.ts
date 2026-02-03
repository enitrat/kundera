import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import { Contract } from "./Contract.js";
import { ContractService } from "./ContractService.js";
import type { Abi } from "kundera-sn/abi";

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
    }).pipe(Effect.provide(Contract), Effect.provide(providerLayer));

    const result = await Effect.runPromise(program);
    expect(result.balance).toBeDefined();
  });
});
