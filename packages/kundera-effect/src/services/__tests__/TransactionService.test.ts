import { describe, expect, it } from "@effect/vitest";
import { afterEach, vi } from "vitest";
import { Effect, Layer } from "effect";
import { Felt252 } from "@kundera-sn/kundera-ts";

import { RpcError, WalletError } from "../../errors.js";
import { ProviderService } from "../ProviderService.js";
import { TransactionLive, TransactionService } from "../TransactionService.js";
import { makeMockWalletProvider } from "./_mocks.js";

const successfulReceipt = {
  type: "INVOKE",
  transaction_hash: "0xbeef",
  actual_fee: { amount: "0x0", unit: "WEI" },
  finality_status: "ACCEPTED_ON_L2",
  messages_sent: [],
  events: [],
  execution_resources: { steps: 1 },
  execution_status: "SUCCEEDED",
} as const;

describe("TransactionService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.effect("sendInvokeAndWait retries until receipt is available", () => {
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

          return Effect.succeed(successfulReceipt as T);
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

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(TransactionService, (tx) =>
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
      );

      expect(result.transactionHash).toBe("0xbeef");
      expect(result.receipt.transaction_hash).toBe("0xbeef");
      expect(receiptAttempts).toBe(3);
    }).pipe(
      Effect.provide(TransactionLive),
      Effect.provide(providerLayer),
      Effect.provide(walletLayer),
    );
  });

  it.effect("accepts Felt252 tx hash in waitForReceipt", () => {
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
        return Effect.succeed(successfulReceipt as T);
      },
    });

    const walletLayer = makeMockWalletProvider({
      addInvokeTransaction: () => Effect.succeed({ transaction_hash: "0xbeef" }),
      addDeclareTransaction: () =>
        Effect.succeed({ transaction_hash: "0xbeef", class_hash: "0x1" }),
      signTypedData: () => Effect.succeed([]),
    });

    const txHash = Felt252.from("0xbeef");

    return Effect.gen(function* () {
      const receipt = yield* Effect.flatMap(TransactionService, (tx) =>
        tx.waitForReceipt(txHash),
      );

      expect(calledHash).toBe(txHash.toHex());
      expect(receipt.transaction_hash).toBe("0xbeef");
    }).pipe(
      Effect.provide(TransactionLive),
      Effect.provide(providerLayer),
      Effect.provide(walletLayer),
    );
  });

  it.effect("fails with TransactionError when maxAttempts is exhausted", () => {
    const txHash = Felt252.from("0xbeef");

    const providerLayer = Layer.succeed(ProviderService, {
      request: (method: string) =>
        Effect.fail(
          new RpcError({
            method,
            code: 25,
            message: "Transaction hash not found",
          }),
        ),
    });

    return Effect.gen(function* () {
      const error = yield* Effect.flip(
        Effect.flatMap(TransactionService, (tx) =>
          tx.waitForReceipt(txHash, { pollIntervalMs: 0, maxAttempts: 3 }),
        ),
      );

      expect(error._tag).toBe("TransactionError");
      expect(error.txHash).toBe(txHash.toHex());
      expect(error.message).toContain("3 attempts");
    }).pipe(
      Effect.provide(TransactionLive),
      Effect.provide(providerLayer),
      Effect.provide(makeMockWalletProvider()),
    );
  });

  it.effect("does not retry non-pending RPC errors", () => {
    let attempts = 0;
    const txHash = Felt252.from("0xbeef");

    const providerLayer = Layer.succeed(ProviderService, {
      request: (method: string) => {
        attempts += 1;
        return Effect.fail(
          new RpcError({
            method,
            code: 40,
            message: "Contract error",
          }),
        );
      },
    });

    return Effect.gen(function* () {
      const error = yield* Effect.flip(
        Effect.flatMap(TransactionService, (tx) =>
          tx.waitForReceipt(txHash, { pollIntervalMs: 0, maxAttempts: 5 }),
        ),
      );

      expect(error._tag).toBe("RpcError");
      expect(error.code).toBe(40);
      expect(attempts).toBe(1);
    }).pipe(
      Effect.provide(TransactionLive),
      Effect.provide(providerLayer),
      Effect.provide(makeMockWalletProvider()),
    );
  });

  it("waits pollIntervalMs between receipt polls", async () => {
    vi.useFakeTimers();

    let attempts = 0;
    const txHash = Felt252.from("0xbeef");

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        attempts += 1;
        if (attempts === 1) {
          return Effect.fail(
            new RpcError({
              method,
              code: 25,
              message: "Transaction hash not found",
            }),
          );
        }
        return Effect.succeed(successfulReceipt as T);
      },
    });

    const program = Effect.flatMap(TransactionService, (tx) =>
      tx.waitForReceipt(txHash, { pollIntervalMs: 50, maxAttempts: 2 }),
    ).pipe(
      Effect.provide(TransactionLive),
      Effect.provide(providerLayer),
      Effect.provide(makeMockWalletProvider()),
    );

    const promise = Effect.runPromise(program);
    await vi.advanceTimersByTimeAsync(49);
    expect(attempts).toBe(1);
    await vi.advanceTimersByTimeAsync(1);

    const receipt = await promise;
    expect(receipt.transaction_hash).toBe("0xbeef");
    expect(attempts).toBe(2);
  });

  it.effect("propagates wallet send errors from sendInvokeAndWait", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>() => Effect.succeed(successfulReceipt as T),
    });

    const walletLayer = makeMockWalletProvider({
      addInvokeTransaction: () =>
        Effect.fail(
          new WalletError({
            operation: "wallet_addInvokeTransaction",
            message: "wallet rejected request",
          }),
        ),
    });

    return Effect.gen(function* () {
      const error = yield* Effect.flip(
        Effect.flatMap(TransactionService, (tx) =>
          tx.sendInvokeAndWait({
            calls: [{ contract_address: "0x123", entry_point: "transfer", calldata: [] }],
          }),
        ),
      );

      expect(error._tag).toBe("WalletError");
      expect(error.operation).toBe("wallet_addInvokeTransaction");
    }).pipe(
      Effect.provide(TransactionLive),
      Effect.provide(providerLayer),
      Effect.provide(walletLayer),
    );
  });

  it.effect("propagates polling errors from sendInvokeAndWait", () => {
    const providerLayer = Layer.succeed(ProviderService, {
      request: (method: string) =>
        Effect.fail(
          new RpcError({
            method,
            code: 40,
            message: "Contract error",
          }),
        ),
    });

    const walletLayer = makeMockWalletProvider({
      addInvokeTransaction: () => Effect.succeed({ transaction_hash: "0xbeef" }),
    });

    return Effect.gen(function* () {
      const error = yield* Effect.flip(
        Effect.flatMap(TransactionService, (tx) =>
          tx.sendInvokeAndWait({
            calls: [{ contract_address: "0x123", entry_point: "transfer", calldata: [] }],
          }),
        ),
      );

      expect(error._tag).toBe("RpcError");
      expect(error.code).toBe(40);
    }).pipe(
      Effect.provide(TransactionLive),
      Effect.provide(providerLayer),
      Effect.provide(walletLayer),
    );
  });
});
