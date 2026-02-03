import { Schema } from "effect";

/**
 * Base context fields shared by all errors
 */
const ErrorContextFields = {
  operation: Schema.String,
  input: Schema.optional(Schema.Unknown),
  expected: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
};

/**
 * Error thrown during primitive operations (Felt252, ContractAddress, etc.)
 */
export class PrimitiveError extends Schema.TaggedError<PrimitiveError>()(
  "PrimitiveError",
  {
    message: Schema.String,
    ...ErrorContextFields,
  }
) {}

/**
 * Error thrown during cryptographic operations (hashing, signing, etc.)
 */
export class CryptoError extends Schema.TaggedError<CryptoError>()(
  "CryptoError",
  {
    message: Schema.String,
    ...ErrorContextFields,
  }
) {}

/**
 * Error thrown during RPC operations (starknet_call, starknet_getBlock, etc.)
 */
export class RpcError extends Schema.TaggedError<RpcError>()(
  "RpcError",
  {
    message: Schema.String,
    ...ErrorContextFields,
  }
) {}

/**
 * Error thrown during serialization/deserialization operations
 */
export class SerdeError extends Schema.TaggedError<SerdeError>()(
  "SerdeError",
  {
    message: Schema.String,
    ...ErrorContextFields,
  }
) {}

/**
 * Error thrown during transport operations (HTTP requests, etc.)
 */
export class TransportError extends Schema.TaggedError<TransportError>()(
  "TransportError",
  {
    message: Schema.String,
    ...ErrorContextFields,
  }
) {}

/**
 * Legacy ErrorContext interface for backwards compatibility with utility functions.
 * @deprecated Prefer constructing errors directly with Schema.TaggedError fields
 */
export interface ErrorContext {
  operation: string;
  input?: unknown;
  expected?: string;
  cause?: unknown;
}
