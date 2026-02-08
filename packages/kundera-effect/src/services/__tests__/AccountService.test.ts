import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { beforeAll } from "vitest";
import { ContractAddress, Felt252, loadWasmCrypto } from "@kundera-sn/kundera-ts";
import type {
  AddDeclareTransactionResult,
  AddDeployAccountTransactionResult,
  AddInvokeTransactionResult,
  FeeEstimate,
} from "@kundera-sn/kundera-ts/jsonrpc";

import { TransactionError } from "../../errors.js";
import { AccountLive, AccountService } from "../AccountService.js";
import { NonceManagerService } from "../NonceManagerService.js";
import { ProviderService } from "../ProviderService.js";

const CHAIN_ID = "0x534e5f5345504f4c4941";

const makeNonceLayer = (nonce = 7n) =>
  Layer.succeed(NonceManagerService, {
    get: () => Effect.succeed(nonce),
    consume: () => Effect.succeed(nonce),
    increment: () => Effect.void,
    reset: () => Effect.void,
  });

beforeAll(async () => {
  await loadWasmCrypto();
});

describe("AccountService", () => {
  it.effect("execute signs and submits INVOKE_V3 transaction", () => {
    let sentInvoke: unknown;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        if (method === "starknet_chainId") {
          return Effect.succeed(CHAIN_ID as T);
        }

        if (method === "starknet_addInvokeTransaction") {
          sentInvoke = params?.[0];
          return Effect.succeed({
            transaction_hash: "0xabc123",
          } as AddInvokeTransactionResult as T);
        }

        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(AccountService, (account) =>
        account.execute({
          contractAddress: "0x111",
          entrypoint: "transfer",
          calldata: ["0x1", "0x2"],
        }),
      );

      expect(result.transaction_hash).toBe("0xabc123");
      const payload = sentInvoke as
        | {
            readonly type: "INVOKE";
            readonly sender_address: string;
            readonly nonce: string;
            readonly signature: readonly string[];
          }
        | undefined;
      expect(payload?.type).toBe("INVOKE");
      expect(payload?.sender_address).toBe(ContractAddress.from("0x1234").toHex());
      expect(payload?.nonce).toBe(Felt252(7n).toHex());
      expect(payload?.signature.length).toBe(2);
    }).pipe(
      Effect.provide(
        AccountLive({
          accountAddress: "0x1234",
          privateKey: "0x123",
        }),
      ),
      Effect.provide(providerLayer),
      Effect.provide(makeNonceLayer(7n)),
    );
  });

  it.effect("declare signs and submits DECLARE_V3 transaction", () => {
    let sentDeclare: unknown;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        if (method === "starknet_chainId") {
          return Effect.succeed(CHAIN_ID as T);
        }

        if (method === "starknet_addDeclareTransaction") {
          sentDeclare = params?.[0];
          return Effect.succeed({
            transaction_hash: "0xdec1are",
            class_hash: "0xclass",
          } as AddDeclareTransactionResult as T);
        }

        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(AccountService, (account) =>
        account.declare({
          classHash: "0x123",
          compiledClassHash: "0x456",
          contract: {
            sierra_program: [],
            contract_class_version: "0.1.0",
            entry_points_by_type: {
              CONSTRUCTOR: [],
              EXTERNAL: [],
              L1_HANDLER: [],
            },
            abi: "[]",
          },
        }),
      );

      expect(result.transaction_hash).toBe("0xdec1are");
      const payload = sentDeclare as
        | { readonly type: "DECLARE"; readonly signature: readonly string[] }
        | undefined;
      expect(payload?.type).toBe("DECLARE");
      expect(payload?.signature.length).toBe(2);
    }).pipe(
      Effect.provide(
        AccountLive({
          accountAddress: "0x1234",
          privateKey: "0x123",
        }),
      ),
      Effect.provide(providerLayer),
      Effect.provide(makeNonceLayer(9n)),
    );
  });

  it.effect("deployAccount signs and submits DEPLOY_ACCOUNT_V3 transaction", () => {
    let sentDeploy: unknown;

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string, params?: readonly unknown[]) => {
        if (method === "starknet_chainId") {
          return Effect.succeed(CHAIN_ID as T);
        }

        if (method === "starknet_addDeployAccountTransaction") {
          sentDeploy = params?.[0];
          return Effect.succeed({
            transaction_hash: "0xdep10y",
            contract_address: "0xacc",
          } as AddDeployAccountTransactionResult as T);
        }

        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(AccountService, (account) =>
        account.deployAccount({
          classHash: "0x1",
          constructorCalldata: ["0x2", "0x3"],
          addressSalt: "0x4",
        }),
      );

      expect(result.transaction_hash).toBe("0xdep10y");
      const payload = sentDeploy as
        | {
            readonly type: "DEPLOY_ACCOUNT";
            readonly contract_address_salt: string;
            readonly signature: readonly string[];
          }
        | undefined;
      expect(payload?.type).toBe("DEPLOY_ACCOUNT");
      expect(payload?.contract_address_salt).toBe("0x4");
      expect(payload?.signature.length).toBe(2);
    }).pipe(
      Effect.provide(
        AccountLive({
          accountAddress: "0x1234",
          privateKey: "0x123",
        }),
      ),
      Effect.provide(providerLayer),
      Effect.provide(makeNonceLayer()),
    );
  });

  it.effect("estimateExecuteFee returns first fee estimate", () => {
    const estimate: FeeEstimate = {
      l1_gas_consumed: "0x1",
      l1_gas_price: "0x2",
      l2_gas_consumed: "0x3",
      l2_gas_price: "0x4",
      l1_data_gas_consumed: "0x5",
      l1_data_gas_price: "0x6",
      overall_fee: "0x7",
      unit: "WEI",
    };

    const providerLayer = Layer.succeed(ProviderService, {
      request: <T>(method: string) => {
        if (method === "starknet_chainId") {
          return Effect.succeed(CHAIN_ID as T);
        }

        if (method === "starknet_estimateFee") {
          return Effect.succeed([estimate] as T);
        }

        return Effect.dieMessage(`unexpected method: ${method}`);
      },
    });

    return Effect.gen(function* () {
      const result = yield* Effect.flatMap(AccountService, (account) =>
        account.estimateExecuteFee({
          contractAddress: "0x111",
          entrypoint: "transfer",
          calldata: ["0x1"],
        }),
      );

      expect(result.overall_fee).toBe("0x7");
    }).pipe(
      Effect.provide(
        AccountLive({
          accountAddress: "0x1234",
          privateKey: "0x123",
        }),
      ),
      Effect.provide(providerLayer),
      Effect.provide(makeNonceLayer()),
    );
  });

  it.effect("fails fast when no signer configuration is provided", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        Effect.flatMap(AccountService, (account) => account.signTransactionHash("0x1")).pipe(
          Effect.provide(
            AccountLive({
              accountAddress: "0x1234",
            }),
          ),
          Effect.provide(
            Layer.succeed(ProviderService, {
              request: <T>() => Effect.succeed("0x0" as T),
            }),
          ),
          Effect.provide(makeNonceLayer()),
        ),
      );

      expect(error._tag).toBe("TransactionError");
      expect(error).toBeInstanceOf(TransactionError);
      expect(error.message).toContain("privateKey or signTransaction");
    }),
  );
});
