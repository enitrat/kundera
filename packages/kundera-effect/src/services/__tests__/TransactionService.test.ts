import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";
import { Felt252 } from "@kundera-sn/kundera-ts";

import { RpcError } from "../../errors.js";
import { ProviderService } from "../ProviderService.js";
import { TransactionLive, TransactionService } from "../TransactionService.js";
import { makeMockWalletProvider } from "./_mocks.js";

describe("TransactionService", () => {
  it("sendInvokeAndWait retries until receipt is available", async () => {
    let receiptAttempts = 0;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_getTransactionReceipt") {
          receiptAttempts += 1;

          if (receiptAttempts < 3) {
            return Effect.fail(
              new RpcError({
                method,
                code: 25,
                message: "Transaction hash not found",
              }),
            );
          }

          return Effect.succeed({
            type: "INVOKE",
            transaction_hash: "0xbeef",
            actual_fee: { amount: "0x0", unit: "WEI" },
            finality_status: "ACCEPTED_ON_L2",
            messages_sent: [],
            events: [],
            execution_resources: { steps: 1 },
            execution_status: "SUCCEEDED",
          } as T);
        }

        return Effect.fail(
          new RpcError({
            method,
            code: -32601,
            message: "Method not supported in test",
          }),
        );
      },
    });

    const walletLayer = makeMockWalletProvider({
      addInvokeTransaction: () => Effect.succeed({ transaction_hash: "0xbeef" }),
      addDeclareTransaction: () =>
        Effect.succeed({ transaction_hash: "0xbeef", class_hash: "0x1" }),
      signTypedData: () => Effect.succeed([]),
    });

    const program = Effect.flatMap(TransactionService, (tx) =>
      tx.sendInvokeAndWait(
        {
          calls: [
            {
              contract_address: "0x123",
              entry_point: "transfer",
              calldata: ["0x1", "0x2"],
            },
          ],
        },
        {
          pollIntervalMs: 0,
          maxAttempts: 4,
        },
      ),
    ).pipe(
      Effect.provide(TransactionLive),
      Effect.provide(providerLayer),
      Effect.provide(walletLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result.transactionHash).toBe("0xbeef");
    expect(result.receipt.transaction_hash).toBe("0xbeef");
    expect(receiptAttempts).toBe(3);
  });

  it("accepts Felt252 tx hash in waitForReceipt", async () => {
    let calledHash: unknown;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        if (method !== "starknet_getTransactionReceipt") {
          return Effect.fail(
            new RpcError({
              method,
              code: -32601,
              message: "Method not supported in test",
            }),
          );
        }

        calledHash = params?.[0];
        return Effect.succeed(
          {
            type: "INVOKE",
            transaction_hash: "0xbeef",
            actual_fee: { amount: "0x0", unit: "WEI" },
            finality_status: "ACCEPTED_ON_L2",
            messages_sent: [],
            events: [],
            execution_resources: { steps: 1 },
            execution_status: "SUCCEEDED",
          } as T,
        );
      },
    });

    const walletLayer = makeMockWalletProvider({
      addInvokeTransaction: () => Effect.succeed({ transaction_hash: "0xbeef" }),
      addDeclareTransaction: () =>
        Effect.succeed({ transaction_hash: "0xbeef", class_hash: "0x1" }),
      signTypedData: () => Effect.succeed([]),
    });

    const txHash = Felt252.from("0xbeef");

    const receipt = await Effect.runPromise(
      Effect.flatMap(TransactionService, (tx) => tx.waitForReceipt(txHash)).pipe(
        Effect.provide(TransactionLive),
        Effect.provide(providerLayer),
        Effect.provide(walletLayer),
      ),
    );

    expect(calledHash).toBe(txHash.toHex());
    expect(receipt.transaction_hash).toBe("0xbeef");
  });
});
