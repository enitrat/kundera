/**
 * kdex class-hash command
 *
 * Get class hash at a contract address.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import { TransportService } from "../config.js";
import { AddressValidationError, ClassHashNotFoundError } from "../errors.js";

/**
 * Parse and validate a contract address
 */
const parseAddress = Effect.fn("kdex.parseAddress")(function* (
  address: string
) {
  return yield* ContractAddress.from(address).pipe(
    Effect.mapError(
      (error) =>
        new AddressValidationError({
          address,
          message: `Invalid address: ${error.message}`,
          cause: error,
        })
    )
  );
});

/**
 * Get the class hash of a contract at the given address
 */
export const classHash = Effect.fn("kdex.classHash")(function* (
  address: string
) {
  const transport = yield* TransportService;
  const contractAddress = yield* parseAddress(address);

  yield* Effect.annotateCurrentSpan({
    "kdex.command": "classHash",
    "kdex.address": address,
  });

  const hash = yield* Rpc.starknet_getClassHashAt(
    transport,
    contractAddress,
    "latest"
  ).pipe(
    Effect.catchTag("RpcError", (error) =>
      Effect.fail(
        new ClassHashNotFoundError({
          address,
          message: `Failed to get class hash: ${error.message}`,
        })
      )
    )
  );

  yield* Effect.log(hash, { classHash: hash, address });

  return hash;
});
