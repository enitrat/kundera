import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { Abi } from "@kundera-sn/kundera-ts/abi";
import { compileCalldata } from "@kundera-sn/kundera-ts/abi";
import { SignerService } from "../Signer/SignerService.js";
import { ContractWrite } from "./ContractWrite.js";
import { ContractWriteService } from "./ContractWriteService.js";

const ERC20_ABI: Abi = [
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

describe("ContractWriteService", () => {
  it("buildCall compiles calldata", async () => {
    const signerLayer = Layer.succeed(SignerService, {
      invoke: () => Effect.succeed({ transaction_hash: "0x1" })
    });

    const program = Effect.gen(function* () {
      const writer = yield* ContractWriteService;
      return yield* writer.buildCall({
        abi: ERC20_ABI,
        address: "0xabc",
        functionName: "balance_of",
        args: ["0x123"]
      });
    }).pipe(Effect.provide(ContractWrite), Effect.provide(signerLayer));

    const call = await Effect.runPromise(program);
    const compiled = compileCalldata(ERC20_ABI, "balance_of", ["0x123"]);
    if (compiled.error) throw compiled.error;
    expect(call.entrypoint).toBe(compiled.result.selectorHex);
    expect(call.calldata).toEqual(compiled.result.calldata);
  });

  it("writeContract invokes signer with built call", async () => {
    let captured: unknown;
    const signerLayer = Layer.succeed(SignerService, {
      invoke: (params: unknown) => {
        captured = params;
        return Effect.succeed({ transaction_hash: "0x1" });
      }
    });

    const program = Effect.gen(function* () {
      const writer = yield* ContractWriteService;
      return yield* writer.writeContract({
        abi: ERC20_ABI,
        address: "0xabc",
        functionName: "balance_of",
        args: ["0x123"],
        resourceBounds: {
          l1_gas: { max_amount: 1n, max_price_per_unit: 1n },
          l2_gas: { max_amount: 1n, max_price_per_unit: 1n }
        }
      });
    }).pipe(Effect.provide(ContractWrite), Effect.provide(signerLayer));

    await Effect.runPromise(program);
    expect(captured).toBeDefined();
    const params = captured as { calls: Array<{ contractAddress: string }> };
    expect(params.calls[0]?.contractAddress).toBe("0xabc");
  });
});
