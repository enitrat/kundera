/**
 * kdex tx command
 *
 * Get transaction details by hash.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { createTransport, type Network } from "../config.js";

export async function tx(txHash: string, network: Network): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    const transaction = yield* Rpc.starknet_getTransactionByHash(transport, txHash);
    return transaction;
  }).pipe(
    Effect.catchTag("RpcError", (e) => {
      console.error(`RPC error: ${e.message}`);
      return Effect.succeed(null);
    })
  );

  const result = await Effect.runPromise(program);

  if (result) {
    console.log(JSON.stringify(result, null, 2));
  }
}

export async function txStatus(txHash: string, network: Network): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    const status = yield* Rpc.starknet_getTransactionStatus(transport, txHash);
    return status;
  }).pipe(
    Effect.catchTag("RpcError", (e) => {
      console.error(`RPC error: ${e.message}`);
      return Effect.succeed(null);
    })
  );

  const result = await Effect.runPromise(program);

  if (result) {
    console.log(JSON.stringify(result, null, 2));
  }
}

export async function txReceipt(txHash: string, network: Network): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    const receipt = yield* Rpc.starknet_getTransactionReceipt(transport, txHash);
    return receipt;
  }).pipe(
    Effect.catchTag("RpcError", (e) => {
      console.error(`RPC error: ${e.message}`);
      return Effect.succeed(null);
    })
  );

  const result = await Effect.runPromise(program);

  if (result) {
    console.log(JSON.stringify(result, null, 2));
  }
}
