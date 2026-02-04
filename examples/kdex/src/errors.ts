/**
 * kdex domain errors
 *
 * Typed errors using Schema.TaggedError for proper error handling
 * and serialization. Each distinct failure mode has its own error type.
 */

import { Schema } from "effect";

/**
 * Error when validating a contract address
 */
export class AddressValidationError extends Schema.TaggedError<AddressValidationError>()(
  "AddressValidationError",
  {
    address: Schema.String,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

/**
 * Error when validating a felt252 value
 */
export class FeltValidationError extends Schema.TaggedError<FeltValidationError>()(
  "FeltValidationError",
  {
    value: Schema.String,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

/**
 * Error when a requested token is not supported
 */
export class TokenNotFoundError extends Schema.TaggedError<TokenNotFoundError>()(
  "TokenNotFoundError",
  {
    token: Schema.String,
    network: Schema.String,
    message: Schema.String,
  }
) {}

/**
 * Error when parsing a block identifier
 */
export class BlockIdParseError extends Schema.TaggedError<BlockIdParseError>()(
  "BlockIdParseError",
  {
    input: Schema.String,
    message: Schema.String,
  }
) {}

/**
 * Error when a transaction is not found
 */
export class TransactionNotFoundError extends Schema.TaggedError<TransactionNotFoundError>()(
  "TransactionNotFoundError",
  {
    hash: Schema.String,
    message: Schema.String,
  }
) {}

/**
 * Error when a block is not found
 */
export class BlockNotFoundError extends Schema.TaggedError<BlockNotFoundError>()(
  "BlockNotFoundError",
  {
    blockId: Schema.String,
    message: Schema.String,
  }
) {}

/**
 * Error when contract class hash lookup fails
 */
export class ClassHashNotFoundError extends Schema.TaggedError<ClassHashNotFoundError>()(
  "ClassHashNotFoundError",
  {
    address: Schema.String,
    message: Schema.String,
  }
) {}

/**
 * Error when storage lookup fails
 */
export class StorageReadError extends Schema.TaggedError<StorageReadError>()(
  "StorageReadError",
  {
    address: Schema.String,
    key: Schema.String,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

/**
 * Error when RPC configuration is invalid
 */
export class ConfigurationError extends Schema.TaggedError<ConfigurationError>()(
  "ConfigurationError",
  {
    key: Schema.String,
    message: Schema.String,
  }
) {}
