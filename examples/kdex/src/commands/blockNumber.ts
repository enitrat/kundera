/**
 * kdex block-number command
 *
 * Get the current block number.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { createTransport, type Network } from "../config.js";

export async function blockNumber(network: Network): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    const blockNum = yield* Rpc.starknet_blockNumber(transport);
    return blockNum;
  });

  const result = await Effect.runPromise(program);
  console.log(result);
}
