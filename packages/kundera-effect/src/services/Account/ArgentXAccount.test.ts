import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { getPublicKey } from "kundera-sn/crypto";
import { Felt252 } from "kundera-sn/Felt252";
import { AccountService } from "./AccountService.js";
import { ArgentXAccount } from "./ArgentXAccount.js";

const toHex = (value: bigint | string) =>
  typeof value === "string" ? value : `0x${value.toString(16)}`;

const feltToHex = (value: { toHex?: () => string }) =>
  typeof value?.toHex === "function" ? value.toHex() : toHex(value as unknown as bigint);

const baseParams = {
  calls: [
    {
      contractAddress: "0x123",
      entrypoint: "transfer",
      calldata: [1n, 2n]
    }
  ],
  nonce: 1n,
  chainId: 23448594291968334n,
  resourceBounds: {
    l1_gas: { max_amount: 1_000_000n, max_price_per_unit: 1n },
    l2_gas: { max_amount: 1_000_000n, max_price_per_unit: 1n }
  }
};

describe("ArgentXAccount", () => {
  it("builds a single-signer signature by default", async () => {
    const layer = ArgentXAccount({
      address: "0xabc",
      privateKey: "0x1"
    });

    const program = Effect.gen(function* () {
      const account = yield* AccountService;
      return yield* account.signInvokeV3(baseParams);
    }).pipe(Effect.provide(layer));

    const tx = await Effect.runPromise(program);
    const publicKey = feltToHex(getPublicKey(Felt252("0x1")));

    expect(tx.signature).toHaveLength(5);
    expect(tx.signature[0]).toBe("0x1");
    expect(tx.signature[1]).toBe("0x0");
    expect(tx.signature[2]).toBe(publicKey);
  });

  it("includes guardian signatures when configured", async () => {
    const layer = ArgentXAccount({
      address: "0xabc",
      privateKey: "0x1",
      guardianPrivateKey: "0x2"
    });

    const program = Effect.gen(function* () {
      const account = yield* AccountService;
      return yield* account.signInvokeV3(baseParams);
    }).pipe(Effect.provide(layer));

    const tx = await Effect.runPromise(program);
    const signerPublicKey = feltToHex(getPublicKey(Felt252("0x1")));
    const guardianPublicKey = feltToHex(getPublicKey(Felt252("0x2")));

    expect(tx.signature).toHaveLength(9);
    expect(tx.signature[0]).toBe("0x2");
    expect(tx.signature[1]).toBe("0x0");
    expect(tx.signature[2]).toBe(signerPublicKey);
    expect(tx.signature[5]).toBe("0x0");
    expect(tx.signature[6]).toBe(guardianPublicKey);
  });
});
