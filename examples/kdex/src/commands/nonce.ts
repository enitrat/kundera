/**
 * kdex nonce command
 *
 * Get account nonce.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import { createTransport, type Network } from "../config.js";

export async function nonce(address: string, network: Network): Promise<void> {
  const transport = createTransport(network);

  const program = Effect.gen(function* () {
    const contractAddress = yield* ContractAddress.from(address);
    const nonceValue = yield* Rpc.starknet_getNonce(
      transport,
      contractAddress.toHex(),
      "pending"
    );
    return nonceValue;
  }).pipe(
    Effect.catchTag("PrimitiveError", (e) => {
      console.error(`Invalid address: ${e.message}`);
      return Effect.succeed("0x0");
    }),
    Effect.catchTag("RpcError", (e) => {
      console.error(`RPC error: ${e.message}`);
      return Effect.succeed("0x0");
    })
  );

  const result = await Effect.runPromise(program);
  console.log(parseInt(result, 16));
}
