/**
 * kdex storage command
 *
 * Get storage at a contract address.
 */

import { Effect } from "effect";
import * as Rpc from "@kundera-sn/kundera-effect/jsonrpc";
import { ContractAddress, Felt252 } from "@kundera-sn/kundera-effect/primitives";
import { TransportService } from "../config.js";
import {
  AddressValidationError,
  FeltValidationError,
  StorageReadError,
} from "../errors.js";

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
 * Parse and validate a felt252 value
 */
const parseFelt = Effect.fn("kdex.parseFelt")(function* (value: string) {
  return yield* Felt252.from(value).pipe(
    Effect.mapError(
      (error) =>
        new FeltValidationError({
          value,
          message: `Invalid felt252: ${error.message}`,
          cause: error,
        })
    )
  );
});

/**
 * Get storage value at a contract address and key
 */
export const storage = Effect.fn("kdex.storage")(function* (
  address: string,
  key: string
) {
  const transport = yield* TransportService;
  const contractAddress = yield* parseAddress(address);
  const storageKey = yield* parseFelt(key);

  yield* Effect.annotateCurrentSpan({
    "kdex.command": "storage",
    "kdex.address": address,
    "kdex.key": key,
  });

  const value = yield* Rpc.starknet_getStorageAt(
    transport,
    contractAddress.toHex(),
    storageKey.toHex(),
    "latest"
  ).pipe(
    Effect.catchTag("RpcError", (error) =>
      Effect.fail(
        new StorageReadError({
          address,
          key,
          message: `Failed to read storage: ${error.message}`,
          cause: error,
        })
      )
    )
  );

  yield* Effect.log(value, { storageValue: value, address, key });

  return value;
});
