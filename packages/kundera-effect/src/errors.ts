import { Data } from "effect";

export class TransportError extends Data.TaggedError("TransportError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Alias the wire-shape type from kundera-ts as `RpcErrorResponse` when imported
// together with this class to avoid naming collisions.
export class RpcError extends Data.TaggedError("RpcError")<{
  readonly method: string;
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}> {}

export class WalletError extends Data.TaggedError("WalletError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class TransactionError extends Data.TaggedError("TransactionError")<{
  readonly operation: string;
  readonly message: string;
  readonly txHash?: string;
  readonly cause?: unknown;
}> {}

export class NonceError extends Data.TaggedError("NonceError")<{
  readonly address: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ContractError extends Data.TaggedError("ContractError")<{
  readonly contractAddress: string;
  readonly functionName: string;
  readonly stage: "encode" | "request" | "decode";
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type KunderaError =
  | TransportError
  | RpcError
  | WalletError
  | TransactionError
  | NonceError
  | ContractError;
