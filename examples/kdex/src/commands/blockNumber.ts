/**
 * kdex block-number command
 *
 * Get the current block number.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { TransportService } from "../config.js";

/**
 * Get the current block number from the network
 */
export const blockNumber = Effect.fn("kdex.blockNumber")(function* () {
  const transport = yield* TransportService;

  yield* Effect.annotateCurrentSpan({ "kdex.command": "blockNumber" });

  const blockNum = yield* Rpc.starknet_blockNumber(transport);

  yield* Effect.log(blockNum, { blockNumber: blockNum });

  return blockNum;
});
