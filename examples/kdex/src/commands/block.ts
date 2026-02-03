/**
 * kdex block command
 *
 * Get block information.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import type { BlockId } from "@kundera-sn/kundera-ts/jsonrpc";
import { TransportTag } from "../config.js";

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

export const block = (blockIdStr: string | undefined, options: { full?: boolean }) =>
  Effect.gen(function* () {
    const transport = yield* TransportTag;
    const blockId = parseBlockId(blockIdStr);

    const result = options.full
      ? yield* Rpc.starknet_getBlockWithTxs(transport, blockId)
      : yield* Rpc.starknet_getBlockWithTxHashes(transport, blockId);

    yield* Effect.log(JSON.stringify(result, null, 2));
    return result;
  });

export const blockHashAndNumber = Effect.gen(function* () {
  const transport = yield* TransportTag;
  const result = yield* Rpc.starknet_blockHashAndNumber(transport);
  yield* Effect.log(`Block #${result.block_number}`);
  yield* Effect.log(`Hash: ${result.block_hash}`);
  return result;
});
