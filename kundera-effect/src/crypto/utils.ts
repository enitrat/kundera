import { Effect } from "effect";
import { CryptoError } from "../errors.js";

export const tryCrypto = <T>(
  operation: string,
  input: unknown,
  expected: string | undefined,
  thunk: () => T
): Effect.Effect<T, CryptoError> =>
  Effect.try({
    try: thunk,
    catch: (error) =>
      new CryptoError({
        message: error instanceof Error ? error.message : "Crypto operation failed",
        operation,
        input,
        expected,
        cause: error instanceof Error ? error : undefined
      })
  });

export const tryCryptoPromise = <T>(
  operation: string,
  input: unknown,
  expected: string | undefined,
  thunk: () => Promise<T>
): Effect.Effect<T, CryptoError> =>
  Effect.tryPromise({
    try: thunk,
    catch: (error) =>
      new CryptoError({
        message: error instanceof Error ? error.message : "Crypto operation failed",
        operation,
        input,
        expected,
        cause: error instanceof Error ? error : undefined
      })
  });
