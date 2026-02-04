/**
 * kdex chain-id command
 *
 * Get the chain ID.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { TransportService } from "../config.js";

/**
 * Get the chain ID from the network
 */
export const chainId = Effect.fn("kdex.chainId")(function* () {
  const transport = yield* TransportService;

  yield* Effect.annotateCurrentSpan({ "kdex.command": "chainId" });

  const id = yield* Rpc.starknet_chainId(transport);

  yield* Effect.log(id, { chainId: id });

  return id;
});
