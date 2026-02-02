export interface ErrorContext {
  operation: string;
  input?: unknown;
  expected?: string;
  cause?: unknown;
}

export class PrimitiveError extends Error {
  readonly _tag = "PrimitiveError";
  readonly operation: string;
  readonly input?: unknown;
  readonly expected?: string;
  readonly cause?: unknown;

  constructor(message: string, context: ErrorContext) {
    super(message, context.cause ? { cause: context.cause } : undefined);
    this.name = "PrimitiveError";
    this.operation = context.operation;
    this.input = context.input;
    this.expected = context.expected;
    this.cause = context.cause;
  }
}

export class CryptoError extends Error {
  readonly _tag = "CryptoError";
  readonly operation: string;
  readonly input?: unknown;
  readonly expected?: string;
  readonly cause?: unknown;

  constructor(message: string, context: ErrorContext) {
    super(message, context.cause ? { cause: context.cause } : undefined);
    this.name = "CryptoError";
    this.operation = context.operation;
    this.input = context.input;
    this.expected = context.expected;
    this.cause = context.cause;
  }
}

export class RpcError extends Error {
  readonly _tag = "RpcError";
  readonly operation: string;
  readonly input?: unknown;
  readonly expected?: string;
  readonly cause?: unknown;

  constructor(message: string, context: ErrorContext) {
    super(message, context.cause ? { cause: context.cause } : undefined);
    this.name = "RpcError";
    this.operation = context.operation;
    this.input = context.input;
    this.expected = context.expected;
    this.cause = context.cause;
  }
}

export class SerdeError extends Error {
  readonly _tag = "SerdeError";
  readonly operation: string;
  readonly input?: unknown;
  readonly expected?: string;
  readonly cause?: unknown;

  constructor(message: string, context: ErrorContext) {
    super(message, context.cause ? { cause: context.cause } : undefined);
    this.name = "SerdeError";
    this.operation = context.operation;
    this.input = context.input;
    this.expected = context.expected;
    this.cause = context.cause;
  }
}

export class TransportError extends Error {
  readonly _tag = "TransportError";
  readonly operation: string;
  readonly input?: unknown;
  readonly expected?: string;
  readonly cause?: unknown;

  constructor(message: string, context: ErrorContext) {
    super(message, context.cause ? { cause: context.cause } : undefined);
    this.name = "TransportError";
    this.operation = context.operation;
    this.input = context.input;
    this.expected = context.expected;
    this.cause = context.cause;
  }
}
