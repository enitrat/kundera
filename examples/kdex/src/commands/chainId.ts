/**
 * kdex chain-id command
 *
 * Get the chain ID.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { TransportTag } from "../config.js";

export const chainId = Effect.gen(function* () {
  const transport = yield* TransportTag;
  const id = yield* Rpc.starknet_chainId(transport);
  yield* Effect.log(id);
  return id;
});
