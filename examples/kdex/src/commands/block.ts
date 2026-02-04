/**
 * kdex block command
 *
 * Get block information.
 */

import { Effect, Option } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import type { BlockId } from "@kundera-sn/kundera-ts/jsonrpc";
import { TransportService } from "../config.js";
import { BlockIdParseError, BlockNotFoundError } from "../errors.js";

/**
 * Parse a block identifier string into a BlockId.
 * Accepts: "latest", "pending", block number, or block hash (0x...)
 */
const parseBlockId = (
  blockIdStr: string | undefined
): Effect.Effect<BlockId, BlockIdParseError> =>
  Effect.gen(function* () {
    if (!blockIdStr || blockIdStr === "latest") {
      return "latest" as const;
    }
    if (blockIdStr === "pending") {
      return "pending" as const;
    }
    if (blockIdStr.startsWith("0x")) {
      return { block_hash: blockIdStr };
    }

    const blockNum = parseInt(blockIdStr, 10);
    if (isNaN(blockNum) || blockNum < 0) {
      return yield* Effect.fail(
        new BlockIdParseError({
          input: blockIdStr,
          message: `Invalid block identifier: ${blockIdStr}. Expected 'latest', 'pending', block number, or block hash (0x...)`,
        })
      );
    }

    return { block_number: blockNum };
  });

/**
 * Format block ID for logging
 */
const formatBlockId = (blockId: BlockId): string => {
  if (blockId === "latest" || blockId === "pending") {
    return blockId;
  }
  if ("block_hash" in blockId) {
    return blockId.block_hash;
  }
  return String(blockId.block_number);
};

export interface BlockOptions {
  readonly full?: boolean;
}

/**
 * Get block information by block ID
 */
export const block = Effect.fn("kdex.block")(function* (
  blockIdStr: string | undefined,
  options: BlockOptions
) {
  const transport = yield* TransportService;
  const blockId = yield* parseBlockId(blockIdStr);

  yield* Effect.annotateCurrentSpan({
    "kdex.command": "block",
    "kdex.blockId": formatBlockId(blockId),
    "kdex.full": options.full ?? false,
  });

  const result = options.full
    ? yield* Rpc.starknet_getBlockWithTxs(transport, blockId).pipe(
        Effect.catchTag("RpcError", (error) =>
          Effect.fail(
            new BlockNotFoundError({
              blockId: formatBlockId(blockId),
              message: `Block not found: ${error.message}`,
            })
          )
        )
      )
    : yield* Rpc.starknet_getBlockWithTxHashes(transport, blockId).pipe(
        Effect.catchTag("RpcError", (error) =>
          Effect.fail(
            new BlockNotFoundError({
              blockId: formatBlockId(blockId),
              message: `Block not found: ${error.message}`,
            })
          )
        )
      );

  yield* Effect.log(JSON.stringify(result, null, 2));

  return result;
});

/**
 * Get the latest block hash and number
 */
export const blockHashAndNumber = Effect.fn("kdex.blockHashAndNumber")(
  function* () {
    const transport = yield* TransportService;

    yield* Effect.annotateCurrentSpan({ "kdex.command": "blockHashAndNumber" });

    const result = yield* Rpc.starknet_blockHashAndNumber(transport);

    yield* Effect.log(`Block #${result.block_number}`, {
      blockNumber: result.block_number,
    });
    yield* Effect.log(`Hash: ${result.block_hash}`, {
      blockHash: result.block_hash,
    });

    return result;
  }
);
