/**
 * kdex chain-id command
 *
 * Get the chain ID.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { createTransport, type Network } from "../config.js";

export async function chainId(network: Network): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    const id = yield* Rpc.starknet_chainId(transport);
    return id;
  });

  const result = await Effect.runPromise(program);
  console.log(result);
}
