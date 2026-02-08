import { Cause, Effect, Either } from "effect";
import type { ProviderService } from "@kundera-sn/kundera-effect/services";
import { getProviderLayer, type Network } from "./config.js";
import { formatError } from "./utils.js";

export const runCommand = (
  effect: Effect.Effect<unknown, unknown, ProviderService>,
  network: Network,
): Promise<void> =>
  effect.pipe(
    Effect.provide(getProviderLayer(network)),
    Effect.catchAllCause((cause) => {
      const failure = Cause.failureOrCause(cause);
      const msg = Either.isLeft(failure)
        ? formatError(failure.left)
        : Cause.pretty(failure.right);
      console.error(msg);
      return Effect.sync(() => process.exit(1));
    }),
    Effect.asVoid,
    Effect.runPromise,
  );
