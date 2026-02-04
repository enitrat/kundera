/**
 * kdex tx command
 *
 * Get transaction details by hash.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { TransportService } from "../config.js";
import { TransactionNotFoundError } from "../errors.js";

/**
 * Get transaction details by hash
 */
export const tx = Effect.fn("kdex.tx")(function* (txHash: string) {
  const transport = yield* TransportService;

  yield* Effect.annotateCurrentSpan({
    "kdex.command": "tx",
    "kdex.txHash": txHash,
  });

  const transaction = yield* Rpc.starknet_getTransactionByHash(
    transport,
    txHash
  ).pipe(
    Effect.catchTag("RpcError", (error) =>
      Effect.fail(
        new TransactionNotFoundError({
          hash: txHash,
          message: `Transaction not found: ${error.message}`,
        })
      )
    )
  );

  yield* Effect.log(JSON.stringify(transaction, null, 2));

  return transaction;
});

/**
 * Get transaction status by hash
 */
export const txStatus = Effect.fn("kdex.txStatus")(function* (txHash: string) {
  const transport = yield* TransportService;

  yield* Effect.annotateCurrentSpan({
    "kdex.command": "txStatus",
    "kdex.txHash": txHash,
  });

  const status = yield* Rpc.starknet_getTransactionStatus(
    transport,
    txHash
  ).pipe(
    Effect.catchTag("RpcError", (error) =>
      Effect.fail(
        new TransactionNotFoundError({
          hash: txHash,
          message: `Transaction status not found: ${error.message}`,
        })
      )
    )
  );

  yield* Effect.log(JSON.stringify(status, null, 2));

  return status;
});

/**
 * Get transaction receipt by hash
 */
export const txReceipt = Effect.fn("kdex.txReceipt")(function* (
  txHash: string
) {
  const transport = yield* TransportService;

  yield* Effect.annotateCurrentSpan({
    "kdex.command": "txReceipt",
    "kdex.txHash": txHash,
  });

  const receipt = yield* Rpc.starknet_getTransactionReceipt(
    transport,
    txHash
  ).pipe(
    Effect.catchTag("RpcError", (error) =>
      Effect.fail(
        new TransactionNotFoundError({
          hash: txHash,
          message: `Transaction receipt not found: ${error.message}`,
        })
      )
    )
  );

  yield* Effect.log(JSON.stringify(receipt, null, 2));

  return receipt;
});
