import { Effect } from "effect";
import type { Result } from "kundera-sn/abi";

export const fromResult = <T, E>(result: Result<T, E>): Effect.Effect<T, E> =>
  result.error === null ? Effect.succeed(result.result as T) : Effect.fail(result.error);
