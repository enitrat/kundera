/**
 * kdex class-hash command
 *
 * Get class hash at a contract address.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import { createTransport, type Network } from "../config.js";

export async function classHash(address: string, network: Network): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    const contractAddress = yield* ContractAddress.from(address);
    const hash = yield* Rpc.starknet_getClassHashAt(
      transport,
      contractAddress.toHex(),
      "latest"
    );
    return hash;
  }).pipe(
    Effect.catchTag("PrimitiveError", (e) => {
      console.error(`Invalid address: ${e.message}`);
      return Effect.succeed("");
    }),
    Effect.catchTag("RpcError", (e) => {
      console.error(`RPC error: ${e.message}`);
      return Effect.succeed("");
    })
  );

  const result = await Effect.runPromise(program);
  if (result) {
    console.log(result);
  }
}
