import { describe, expect, it } from "vitest";
import { Effect, Layer } from "effect";

import { SignerLive, SignerService } from "../SignerService.js";
import { TransactionService } from "../TransactionService.js";
import { WalletProviderService } from "../WalletProviderService.js";

describe("SignerService", () => {
  it("delegates wallet account requests", async () => {
    let requestAccountsOptions: unknown;

    const walletLayer = Layer.succeed(WalletProviderService, {
      request: () => Effect.succeed([]),
      supportedWalletApi: () => Effect.succeed([]),
      supportedSpecs: () => Effect.succeed([]),
      getPermissions: () => Effect.succeed([]),
      requestAccounts: (options?: unknown) => {
        requestAccountsOptions = options;
        return Effect.succeed(["0xabc"]);
      },
      requestChainId: () => Effect.succeed("0x534e5f5345504f4c4941"),
      deploymentData: () =>
        Effect.succeed({
          address: "0xabc",
          class_hash: "0x1",
          salt: "0x2",
          calldata: ["0x3"],
          version: 1,
        }),
      watchAsset: () => Effect.succeed(true),
      addStarknetChain: () => Effect.succeed(true),
      switchStarknetChain: () => Effect.succeed(true),
      addInvokeTransaction: () => Effect.succeed({ transaction_hash: "0xbeef" }),
      addDeclareTransaction: () =>
        Effect.succeed({ transaction_hash: "0xbeef", class_hash: "0x1" }),
      signTypedData: () => Effect.succeed([]),
    });

    const transactionLayer = Layer.succeed(TransactionService, {
      sendInvoke: () => Effect.succeed({ transactionHash: "0xbeef" }),
      waitForReceipt: () =>
        Effect.succeed({
          type: "INVOKE",
          transaction_hash: "0xbeef",
          actual_fee: { amount: "0x0", unit: "WEI" },
          finality_status: "ACCEPTED_ON_L2",
          messages_sent: [],
          events: [],
          execution_resources: { steps: 1 },
          execution_status: "SUCCEEDED",
        }),
      sendInvokeAndWait: () =>
        Effect.succeed({
          transactionHash: "0xbeef",
          receipt: {
            type: "INVOKE",
            transaction_hash: "0xbeef",
            actual_fee: { amount: "0x0", unit: "WEI" },
            finality_status: "ACCEPTED_ON_L2",
            messages_sent: [],
            events: [],
            execution_resources: { steps: 1 },
            execution_status: "SUCCEEDED",
          },
        }),
    });

    const program = Effect.flatMap(SignerService, (signer) =>
      signer.requestAccounts({ silentMode: true }),
    ).pipe(
      Effect.provide(SignerLive),
      Effect.provide(walletLayer),
      Effect.provide(transactionLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result).toEqual(["0xabc"]);
    expect(requestAccountsOptions).toEqual({ silentMode: true });
  });

  it("delegates invoke send-and-wait to transaction service", async () => {
    const walletLayer = Layer.succeed(WalletProviderService, {
      request: () => Effect.succeed([]),
      supportedWalletApi: () => Effect.succeed([]),
      supportedSpecs: () => Effect.succeed([]),
      getPermissions: () => Effect.succeed([]),
      requestAccounts: () => Effect.succeed(["0xabc"]),
      requestChainId: () => Effect.succeed("0x534e5f5345504f4c4941"),
      deploymentData: () =>
        Effect.succeed({
          address: "0xabc",
          class_hash: "0x1",
          salt: "0x2",
          calldata: ["0x3"],
          version: 1,
        }),
      watchAsset: () => Effect.succeed(true),
      addStarknetChain: () => Effect.succeed(true),
      switchStarknetChain: () => Effect.succeed(true),
      addInvokeTransaction: () => Effect.succeed({ transaction_hash: "0xbeef" }),
      addDeclareTransaction: () =>
        Effect.succeed({ transaction_hash: "0xbeef", class_hash: "0x1" }),
      signTypedData: () => Effect.succeed([]),
    });

    const transactionLayer = Layer.succeed(TransactionService, {
      sendInvoke: () => Effect.succeed({ transactionHash: "0xbeef" }),
      waitForReceipt: () =>
        Effect.succeed({
          type: "INVOKE",
          transaction_hash: "0xbeef",
          actual_fee: { amount: "0x0", unit: "WEI" },
          finality_status: "ACCEPTED_ON_L2",
          messages_sent: [],
          events: [],
          execution_resources: { steps: 1 },
          execution_status: "SUCCEEDED",
        }),
      sendInvokeAndWait: () =>
        Effect.succeed({
          transactionHash: "0xbeef",
          receipt: {
            type: "INVOKE",
            transaction_hash: "0xbeef",
            actual_fee: { amount: "0x0", unit: "WEI" },
            finality_status: "ACCEPTED_ON_L2",
            messages_sent: [],
            events: [],
            execution_resources: { steps: 1 },
            execution_status: "SUCCEEDED",
          },
        }),
    });

    const program = Effect.flatMap(SignerService, (signer) =>
      signer.sendInvokeAndWait({
        calls: [
          {
            contract_address: "0x123",
            entry_point: "transfer",
            calldata: ["0x1", "0x2"],
          },
        ],
      }),
    ).pipe(
      Effect.provide(SignerLive),
      Effect.provide(walletLayer),
      Effect.provide(transactionLayer),
    );

    const result = await Effect.runPromise(program);

    expect(result.transactionHash).toBe("0xbeef");
    expect(result.receipt.transaction_hash).toBe("0xbeef");
  });
});
