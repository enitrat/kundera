import { Effect } from "effect";
import type { ProviderService } from "@kundera-sn/kundera-effect/services";
import { getProviderLayer, type Network } from "./config.js";
import { formatError } from "./utils.js";

export const runCommand = (
  effect: Effect.Effect<unknown, unknown, ProviderService>,
  network: Network,
): Promise<void> =>
  effect.pipe(
    Effect.provide(getProviderLayer(network)),
    Effect.asVoid,
    Effect.runPromise,
  ).catch((error) => {
    console.error(formatError(error));
    process.exit(1);
  });
