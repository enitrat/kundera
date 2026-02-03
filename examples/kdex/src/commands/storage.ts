/**
 * kdex storage command
 *
 * Get storage at a contract address.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress, Felt252 } from "@kundera-sn/kundera-effect/primitives";
import { TransportTag } from "../config.js";

export const storage = (address: string, key: string) =>
  Effect.gen(function* () {
    const transport = yield* TransportTag;
    const contractAddress = yield* ContractAddress.from(address);
    const storageKey = yield* Felt252.from(key);
    const value = yield* Rpc.starknet_getStorageAt(
      transport,
      contractAddress.toHex(),
      storageKey.toHex(),
      "latest"
    );
    yield* Effect.log(value);
    return value;
  });
