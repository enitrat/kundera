import { Context, Effect, Layer, Schedule } from "effect";
import { Felt252, type Felt252Type } from "@kundera-sn/kundera-ts";
import type { WalletInvokeParams } from "@kundera-sn/kundera-ts/provider";
import { Rpc, type TxnReceiptWithBlockInfo } from "@kundera-sn/kundera-ts/jsonrpc";

import {
  RpcError,
  TransactionError,
  type TransportError,
  WalletError,
} from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import { WalletProviderService } from "./WalletProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export interface WaitForReceiptOptions {
  readonly pollIntervalMs?: number;
  readonly maxAttempts?: number;
  readonly requestOptions?: RequestOptions;
}

export interface SendInvokeAndWaitOptions extends WaitForReceiptOptions {
  readonly invokeOptions?: RequestOptions;
}

export interface TransactionServiceShape {
  readonly sendInvoke: (
    params: WalletInvokeParams,
    options?: RequestOptions,
  ) => Effect.Effect<{ transactionHash: string }, WalletError | RpcError>;

  readonly waitForReceipt: (
    txHash: Felt252Type,
    options?: WaitForReceiptOptions,
  ) => Effect.Effect<
    TxnReceiptWithBlockInfo,
    TransportError | RpcError | TransactionError
  >;

  readonly sendInvokeAndWait: (
    params: WalletInvokeParams,
    options?: SendInvokeAndWaitOptions,
  ) => Effect.Effect<
    { transactionHash: string; receipt: TxnReceiptWithBlockInfo },
    WalletError | TransportError | RpcError | TransactionError
  >;
}

export class TransactionService extends Context.Tag(
  "@kundera/TransactionService",
)<TransactionService, TransactionServiceShape>() {}

const BLOCK_NOT_FOUND_CODE: RpcError["code"] = 24;
const INVALID_TRANSACTION_HASH_CODE: RpcError["code"] = 25;
const TRANSACTION_HASH_NOT_FOUND_CODE: RpcError["code"] = 29;

const RECEIPT_NOT_READY_CODES = new Set<number>([
  BLOCK_NOT_FOUND_CODE,
  INVALID_TRANSACTION_HASH_CODE,
  TRANSACTION_HASH_NOT_FOUND_CODE,
]);

const isReceiptPending = (error: RpcError): boolean => {
  if (RECEIPT_NOT_READY_CODES.has(error.code)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("not received") ||
    message.includes("pending")
  );
};

export const TransactionLive: Layer.Layer<
  TransactionService,
  never,
  ProviderService | WalletProviderService
> = Layer.effect(
  TransactionService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    const wallet = yield* WalletProviderService;

    const sendInvoke: TransactionServiceShape["sendInvoke"] = (params, options) =>
      wallet.addInvokeTransaction(params, options).pipe(
        Effect.map((result) => ({ transactionHash: result.transaction_hash })),
      );

    const waitForReceipt: TransactionServiceShape["waitForReceipt"] = (
      txHash,
      options,
    ) => {
      const txHashHex = txHash.toHex();
      const pollIntervalMs = Math.max(options?.pollIntervalMs ?? 1_500, 0);
      const maxAttempts = Math.max(options?.maxAttempts ?? 40, 1);

      const { method, params } = Rpc.GetTransactionReceiptRequest(txHashHex);
      return Effect.suspend(() =>
        provider.request<TxnReceiptWithBlockInfo>(
          method,
          params,
          options?.requestOptions,
        ),
      )
        .pipe(
          Effect.retry(
            Schedule.recurs(maxAttempts - 1).pipe(
              Schedule.addDelay(() => `${pollIntervalMs} millis`),
              Schedule.whileInput(
                (error: TransportError | RpcError) =>
                  error._tag === "RpcError" && isReceiptPending(error),
              ),
            ),
          ),
          Effect.catchTag(
            "RpcError",
            (error): Effect.Effect<never, RpcError | TransactionError> =>
              isReceiptPending(error)
                ? Effect.fail(
                    new TransactionError({
                      operation: "waitForReceipt",
                      message: `Transaction receipt not available after ${maxAttempts} attempts`,
                      txHash: txHashHex,
                      cause: error,
                    }),
                  )
                : Effect.fail(error),
          ),
        );
    };

    const sendInvokeAndWait: TransactionServiceShape["sendInvokeAndWait"] = (
      params,
      options,
    ) =>
      Effect.gen(function* () {
        const sent = yield* sendInvoke(params, options?.invokeOptions);
        const txHash = yield* Effect.try({
          try: () => Felt252.from(sent.transactionHash),
          catch: (cause) =>
            new TransactionError({
              operation: "sendInvokeAndWait",
              message: `Invalid transaction hash returned by wallet: ${sent.transactionHash}`,
              txHash: sent.transactionHash,
              cause,
            }),
        });
        const receipt = yield* waitForReceipt(txHash, options);

        return {
          transactionHash: sent.transactionHash,
          receipt,
        };
      });

    return {
      sendInvoke,
      waitForReceipt,
      sendInvokeAndWait,
    } satisfies TransactionServiceShape;
  }),
);
