/**
 * kdex nonce command
 *
 * Get account nonce.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress } from "@kundera-sn/kundera-effect/primitives";
import { TransportService } from "../config.js";
import { AddressValidationError } from "../errors.js";

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
 * Get the nonce of an account
 */
export const nonce = Effect.fn("kdex.nonce")(function* (address: string) {
  const transport = yield* TransportService;
  const contractAddress = yield* parseAddress(address);

  yield* Effect.annotateCurrentSpan({
    "kdex.command": "nonce",
    "kdex.address": address,
  });

  const nonceValue = yield* Rpc.starknet_getNonce(
    transport,
    contractAddress.toHex(),
    "pending"
  );

  const nonceInt = parseInt(nonceValue, 16);

  yield* Effect.log(nonceInt, { nonce: nonceInt, address });

  return nonceValue;
});
