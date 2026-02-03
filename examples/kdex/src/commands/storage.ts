/**
 * kdex storage command
 *
 * Get storage at a contract address.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress, Felt252 } from "@kundera-sn/kundera-effect/primitives";
import { createTransport, type Network } from "../config.js";

export async function storage(
  address: string,
  key: string,
  network: Network
): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    const contractAddress = yield* ContractAddress.from(address);
    const storageKey = yield* Felt252.from(key);
    const value = yield* Rpc.starknet_getStorageAt(
      transport,
      contractAddress.toHex(),
      storageKey.toHex(),
      "latest"
    );
    return value;
  }).pipe(
    Effect.catchTag("PrimitiveError", (e) => {
      console.error(`Invalid input: ${e.message}`);
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
