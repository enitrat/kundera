import { Effect } from "effect";
import { PrimitiveError } from "../errors.js";

export const tryPrimitive = <T>(
  operation: string,
  input: unknown,
  expected: string | undefined,
  thunk: () => T
): Effect.Effect<T, PrimitiveError> =>
  Effect.try({
    try: thunk,
    catch: (error) =>
      new PrimitiveError(
        error instanceof Error ? error.message : "Primitive operation failed",
        {
          operation,
          input,
          expected,
          cause: error instanceof Error ? error : undefined
        }
      )
  });
