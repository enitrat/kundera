/**
 * kdex block command
 *
 * Get block information.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import type { BlockId } from "@kundera-sn/kundera-ts/jsonrpc";
import { createTransport, type Network } from "../config.js";

function parseBlockId(blockIdStr: string | undefined): BlockId {
  if (!blockIdStr || blockIdStr === "latest") {
    return "latest";
  }
  if (blockIdStr === "pending") {
    return "pending";
  }
  if (blockIdStr.startsWith("0x")) {
    return { block_hash: blockIdStr };
  }
  return { block_number: parseInt(blockIdStr, 10) };
}

export async function block(
  blockIdStr: string | undefined,
  options: { full?: boolean },
  network: Network
): Promise<void> {
  const transport = createTransport(network);
  const blockId = parseBlockId(blockIdStr);

  const program = Effect.gen(function* () {
    if (options.full) {
      return yield* Rpc.starknet_getBlockWithTxs(transport, blockId);
    }
    return yield* Rpc.starknet_getBlockWithTxHashes(transport, blockId);
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

export async function blockHashAndNumber(network: Network): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    return yield* Rpc.starknet_blockHashAndNumber(transport);
  });

  const result = await Effect.runPromise(program);
  console.log(`Block #${result.block_number}`);
  console.log(`Hash: ${result.block_hash}`);
}
