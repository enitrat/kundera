/**
 * kdex class-hash command
 *
 * Get class hash at a contract address.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import { TransportTag } from "../config.js";

export const classHash = (address: string) =>
  Effect.gen(function* () {
    const transport = yield* TransportTag;
    const contractAddress = yield* ContractAddress.from(address);
    const hash = yield* Rpc.starknet_getClassHashAt(
      transport,
      contractAddress,
      "latest"
    );
    yield* Effect.log(hash);
    return hash;
  });
