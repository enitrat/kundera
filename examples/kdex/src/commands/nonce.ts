/**
 * kdex nonce command
 *
 * Get account nonce.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import { TransportTag } from "../config.js";

export const nonce = (address: string) =>
  Effect.gen(function* () {
    const transport = yield* TransportTag;
    const contractAddress = yield* ContractAddress.from(address);
    const nonceValue = yield* Rpc.starknet_getNonce(
      transport,
      contractAddress.toHex(),
      "pending"
    );
    yield* Effect.log(parseInt(nonceValue, 16));
    return nonceValue;
  });
