/**
 * kdex block-number command
 *
 * Get the current block number.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { TransportTag } from "../config.js";

export const blockNumber = Effect.gen(function* () {
  const transport = yield* TransportTag;
  const blockNum = yield* Rpc.starknet_blockNumber(transport);
  yield* Effect.log(blockNum);
  return blockNum;
});
