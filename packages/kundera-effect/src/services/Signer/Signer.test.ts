import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import { AccountService } from "../Account/AccountService.js";
import { Signer } from "./Signer.js";
import { SignerService } from "./SignerService.js";

const accountLayer = Layer.succeed(AccountService, {
  address: "0xabc",
  publicKey: "0x1",
  toRpcResourceBounds: (input) => ({
    l1_gas: {
      max_amount: `0x${input.l1_gas.max_amount.toString(16)}`,
      max_price_per_unit: `0x${input.l1_gas.max_price_per_unit.toString(16)}`
    },
    l2_gas: {
      max_amount: `0x${input.l2_gas.max_amount.toString(16)}`,
      max_price_per_unit: `0x${input.l2_gas.max_price_per_unit.toString(16)}`
    }
  }),
  signInvokeV3: () =>
    Effect.succeed({
      type: "INVOKE",
      version: "0x3",
      sender_address: "0xabc",
      calldata: [],
      signature: [],
      nonce: "0x1",
      resource_bounds: {
        l1_gas: { max_amount: "0x1", max_price_per_unit: "0x1" },
        l2_gas: { max_amount: "0x1", max_price_per_unit: "0x1" }
      },
      tip: "0x0",
      paymaster_data: [],
      account_deployment_data: [],
      nonce_data_availability_mode: "L1",
      fee_data_availability_mode: "L1"
    })
});

describe("SignerService", () => {
  it("invokes addInvokeTransaction", async () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: ({ method }: { method: string }) => {
        if (method === "starknet_chainId") {
          return Effect.succeed("0x534e5f5345504f4c4941");
        }
        if (method === "starknet_addInvokeTransaction") {
          return Effect.succeed({ transaction_hash: "0x1" });
        }
        return Effect.fail(new Error("unexpected"));
      }
    });

    const program = Effect.gen(function* () {
      const signer = yield* SignerService;
      return yield* signer.invoke({
        calls: [],
        resourceBounds: {
          l1_gas: { max_amount: 1n, max_price_per_unit: 1n },
          l2_gas: { max_amount: 1n, max_price_per_unit: 1n }
        },
        nonce: 1n,
        chainId: 1n
      });
    }).pipe(Effect.provide(Signer), Effect.provide(providerLayer), Effect.provide(accountLayer));

    const result = await Effect.runPromise(program);
    expect(result.transaction_hash).toBe("0x1");
  });
});
