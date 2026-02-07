import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import type {
  StarknetWindowObject,
  WalletRequestArguments,
} from "@kundera-sn/kundera-ts/provider";

import { WalletProviderLive, WalletProviderService } from "../WalletProviderService.js";

const makeMockWallet = (
  onRequest?: (args: WalletRequestArguments) => void,
): StarknetWindowObject => ({
  id: "mock-wallet",
  name: "Mock Wallet",
  version: "1.0.0",
  icon: "",
  request: async (args: WalletRequestArguments) => {
    onRequest?.(args);

    if (args.type === "wallet_supportedWalletApi") {
      return ["1.0.0"];
    }

    if (args.type === "wallet_supportedSpecs") {
      return ["SNIP-8"];
    }

    if (args.type === "wallet_getPermissions") {
      return ["wallet_accounts"];
    }

    if (args.type === "wallet_requestAccounts") {
      return ["0xabc"];
    }

    if (args.type === "wallet_requestChainId") {
      return "0x534e5f5345504f4c4941";
    }

    if (args.type === "wallet_deploymentData") {
      return {
        address: "0xabc",
        class_hash: "0x1",
        salt: "0x2",
        calldata: ["0x3"],
        version: 1,
      };
    }

    if (args.type === "wallet_watchAsset") {
      return true;
    }

    if (args.type === "wallet_addStarknetChain") {
      return true;
    }

    if (args.type === "wallet_switchStarknetChain") {
      return true;
    }

    if (args.type === "wallet_addInvokeTransaction") {
      return { transaction_hash: "0xdeadbeef" };
    }

    if (args.type === "wallet_addDeclareTransaction") {
      return { transaction_hash: "0xbeef", class_hash: "0x99" };
    }

    if (args.type === "wallet_signTypedData") {
      return ["0x1", "0x2"];
    }

    throw new Error(`unsupported: ${args.type}`);
  },
  on: () => undefined,
  off: () => undefined,
});

describe("WalletProviderService", () => {
  it("requests accounts", async () => {
    const program = Effect.flatMap(WalletProviderService, (wallet) =>
      wallet.requestAccounts(),
    ).pipe(Effect.provide(WalletProviderLive(makeMockWallet())));

    const accounts = await Effect.runPromise(program);

    expect(accounts).toEqual(["0xabc"]);
  });

  it("maps legacy silentMode to silent_mode", async () => {
    let payload: WalletRequestArguments | undefined;

    const program = Effect.flatMap(WalletProviderService, (wallet) =>
      wallet.requestAccounts({ silentMode: true }),
    ).pipe(
      Effect.provide(
        WalletProviderLive(
          makeMockWallet((args) => {
            payload = args;
          }),
        ),
      ),
    );

    await Effect.runPromise(program);

    expect(payload).toBeDefined();
    expect(payload?.type).toBe("wallet_requestAccounts");
    expect(payload?.params).toEqual({ silent_mode: true });
  });

  it("submits wallet invoke transaction", async () => {
    const program = Effect.flatMap(WalletProviderService, (wallet) =>
      wallet.addInvokeTransaction({
        calls: [
          {
            contract_address: "0x123",
            entry_point: "transfer",
            calldata: ["0x1", "0x2"],
          },
        ],
      }),
    ).pipe(Effect.provide(WalletProviderLive(makeMockWallet())));

    const response = await Effect.runPromise(program);

    expect(response.transaction_hash).toBe("0xdeadbeef");
  });
});
