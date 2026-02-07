import { describe, expect, it } from "@effect/vitest";
import { afterEach, vi } from "vitest";
import { Effect } from "effect";
import { ContractAddress } from "@kundera-sn/kundera-ts";
import type {
  StarknetWindowObject,
  WalletRequestArguments,
} from "@kundera-sn/kundera-ts/provider";

import * as Presets from "../index.js";
import { JsonRpc, Services } from "../../index.js";

const mockedFetch = vi.fn<typeof fetch>();

const mockWallet: StarknetWindowObject = {
  id: "mock",
  name: "Mock",
  version: "1.0.0",
  icon: "",
  request: async (args: WalletRequestArguments) => {
    if (args.type === "wallet_requestAccounts") {
      return ["0xabc"];
    }
    if (args.type === "wallet_requestChainId") {
      return "0x534e5f5345504f4c4941";
    }
    if (args.type === "wallet_addInvokeTransaction") {
      return { transaction_hash: "0xbeef" };
    }
    throw new Error(`unsupported ${args.type}`);
  },
  on: () => undefined,
  off: () => undefined,
};

describe("presets", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockedFetch.mockReset();
  });

  it.effect("createProvider works with JSON-RPC helpers", () => {
    vi.stubGlobal("fetch", mockedFetch);

    mockedFetch.mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { id?: number; method: string };
      const result = body.method === "starknet_chainId" ? "0x534e5f5345504f4c4941" : 1;

      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id ?? 1,
          result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    return Effect.gen(function* () {
      const chainId = yield* JsonRpc.chainId();
      const block = yield* JsonRpc.blockNumber();

      expect(chainId).toBe("0x534e5f5345504f4c4941");
      expect(block).toBe(1);
    }).pipe(Effect.provide(Presets.createProvider("https://rpc.example")));
  });

  it.effect("wallet base stack wires wallet and nonce services", () => {
    vi.stubGlobal("fetch", mockedFetch);

    mockedFetch.mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { id?: number; method: string };
      const result = body.method === "starknet_chainId" ? "0x534e5f5345504f4c4941" : "0x5";

      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id ?? 1,
          result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    const stack = Presets.SepoliaWalletBaseStack({
      swo: mockWallet,
      rpcUrl: "https://rpc.example",
    });

    return Effect.gen(function* () {
      const wallet = yield* Services.WalletProviderService;
      const nonce = yield* Services.NonceManagerService;
      const contract = yield* Services.ContractService;
      const feeEstimator = yield* Services.FeeEstimatorService;
      const chain = yield* Services.ChainService;

      const accounts = yield* wallet.requestAccounts();
      const nextNonce = yield* nonce.consume(
        ContractAddress.from(accounts[0] ?? "0xabc"),
      );
      const networkName = yield* chain.networkName();

      expect(accounts).toEqual(["0xabc"]);
      expect(nextNonce).toBe(5n);
      expect(networkName).toBe("sepolia");
      expect(typeof contract.at === "function").toBe(true);
      expect(typeof feeEstimator.estimate === "function").toBe(true);
    }).pipe(Effect.provide(stack));
  });

  it.effect("wallet stack wires transaction and contract write flow", () => {
    vi.stubGlobal("fetch", mockedFetch);

    mockedFetch.mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { id?: number; method: string };
      const result =
        body.method === "starknet_getTransactionReceipt"
          ? {
              type: "INVOKE",
              transaction_hash: "0xbeef",
              actual_fee: { amount: "0x0", unit: "WEI" },
              finality_status: "ACCEPTED_ON_L2",
              messages_sent: [],
              events: [],
              execution_resources: { steps: 1 },
              execution_status: "SUCCEEDED",
            }
          : "0x0";

      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id ?? 1,
          result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    const stack = Presets.SepoliaWalletStack({
      swo: mockWallet,
      rpcUrl: "https://rpc.example",
    });

    return Effect.gen(function* () {
      const transactions = yield* Services.TransactionService;
      const writer = yield* Services.ContractWriteService;

      const transactionResult = yield* transactions.sendInvokeAndWait({
        calls: [
          {
            contract_address: "0x123",
            entry_point: "transfer",
            calldata: ["0x1", "0x2"],
          },
        ],
      });

      const writerResult = yield* writer.invokeAndWait({
        calls: [
          {
            contract_address: "0x123",
            entry_point: "transfer",
            calldata: ["0x1", "0x2"],
          },
        ],
      });

      expect(transactionResult.transactionHash).toBe("0xbeef");
      expect(transactionResult.receipt.transaction_hash).toBe("0xbeef");
      expect(writerResult.transactionHash).toBe("0xbeef");
      expect(writerResult.receipt.transaction_hash).toBe("0xbeef");
    }).pipe(Effect.provide(stack));
  });
});
