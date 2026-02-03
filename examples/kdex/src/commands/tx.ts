/**
 * kdex tx command
 *
 * Get transaction details by hash.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { TransportTag } from "../config.js";

export const tx = (txHash: string) =>
  Effect.gen(function* () {
    const transport = yield* TransportTag;
    const transaction = yield* Rpc.starknet_getTransactionByHash(transport, txHash);
    yield* Effect.log(JSON.stringify(transaction, null, 2));
    return transaction;
  });

export const txStatus = (txHash: string) =>
  Effect.gen(function* () {
    const transport = yield* TransportTag;
    const status = yield* Rpc.starknet_getTransactionStatus(transport, txHash);
    yield* Effect.log(JSON.stringify(status, null, 2));
    return status;
  });

export const txReceipt = (txHash: string) =>
  Effect.gen(function* () {
    const transport = yield* TransportTag;
    const receipt = yield* Rpc.starknet_getTransactionReceipt(transport, txHash);
    yield* Effect.log(JSON.stringify(receipt, null, 2));
    return receipt;
  });
