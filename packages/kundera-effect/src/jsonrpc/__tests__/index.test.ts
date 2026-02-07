import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { ClassHash, ContractAddress, Felt252, StorageKey } from "@kundera-sn/kundera-ts";

import type { ProviderServiceShape } from "../../services/ProviderService.js";
import { ProviderService } from "../../services/ProviderService.js";
import * as JsonRpc from "../index.js";

describe("jsonrpc wrappers", () => {
  it.effect("maps blockNumber to starknet_blockNumber", () => {
    let calledMethod = "";

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        calledMethod = method;
        return Effect.succeed(123 as T);
      },
    } satisfies ProviderServiceShape);

    return Effect.gen(function* () {
      const value = yield* JsonRpc.blockNumber();

      expect(value).toBe(123);
      expect(calledMethod).toBe("starknet_blockNumber");
    }).pipe(Effect.provide(providerLayer));
  });

  it.effect("maps getTransactionReceipt params correctly", () => {
    let calledParams: readonly unknown[] | undefined;
    const txHash = Felt252.from("0xabc");

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(_method: string, params?: readonly unknown[]) => {
        calledParams = params;
        return Effect.succeed(
          {
            type: "INVOKE",
            transaction_hash: "0xabc",
            actual_fee: { amount: "0x0", unit: "WEI" },
            finality_status: "ACCEPTED_ON_L2",
            messages_sent: [],
            events: [],
            execution_resources: { steps: 1 },
            execution_status: "SUCCEEDED",
          } as T,
        );
      },
    } satisfies ProviderServiceShape);

    return Effect.gen(function* () {
      const receipt = yield* JsonRpc.getTransactionReceipt(txHash);

      expect(calledParams).toEqual([txHash.toHex()]);
      expect(receipt.transaction_hash).toBe("0xabc");
    }).pipe(Effect.provide(providerLayer));
  });

  it.effect("maps getNonce params correctly when using ContractAddress primitive", () => {
    let calledParams: readonly unknown[] | undefined;
    const address = ContractAddress.from("0xabc");

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(_method: string, params?: readonly unknown[]) => {
        calledParams = params;
        return Effect.succeed("0x1" as T);
      },
    } satisfies ProviderServiceShape);

    return Effect.gen(function* () {
      const nonce = yield* JsonRpc.getNonce(address);

      expect(calledParams).toEqual(["latest", address.toHex()]);
      expect(nonce).toBe("0x1");
    }).pipe(Effect.provide(providerLayer));
  });

  it.effect("maps getTransactionByBlockIdAndIndex params correctly", () => {
    let calledMethod = "";
    let calledParams: readonly unknown[] | undefined;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        calledMethod = method;
        calledParams = params;
        return Effect.succeed({ transaction_hash: "0xabc" } as T);
      },
    } satisfies ProviderServiceShape);

    return Effect.gen(function* () {
      yield* JsonRpc.getTransactionByBlockIdAndIndex({ block_number: 12 }, 3);

      expect(calledMethod).toBe("starknet_getTransactionByBlockIdAndIndex");
      expect(calledParams).toEqual([{ block_number: 12 }, 3]);
    }).pipe(Effect.provide(providerLayer));
  });

  it.effect("maps getStorageProof params using branded primitives", () => {
    let calledMethod = "";
    let calledParams: readonly unknown[] | undefined;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        calledMethod = method;
        calledParams = params;
        return Effect.succeed({} as T);
      },
    } satisfies ProviderServiceShape);

    const classHash = ClassHash.from("0x123");
    const address = ContractAddress.from("0xabc");
    const key = StorageKey.from("0x77");

    return Effect.gen(function* () {
      yield* JsonRpc.getStorageProof(
        { block_hash: "0x1" },
        {
          classHashes: [classHash],
          contractAddresses: [address],
          contractStorageKeys: [{ contractAddress: address, storageKeys: [key] }],
        },
      );

      expect(calledMethod).toBe("starknet_getStorageProof");
      expect(calledParams).toEqual([
        { block_hash: "0x1" },
        [classHash.toHex()],
        [address.toHex()],
        [{ contract_address: address.toHex(), storage_keys: [key.toHex()] }],
      ]);
    }).pipe(Effect.provide(providerLayer));
  });
});
