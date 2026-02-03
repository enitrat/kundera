import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import { NonceError, NonceManagerService } from "./NonceManagerService.js";

const keyFor = (address: string, chainId: bigint) => `${chainId.toString(16)}:${address.toLowerCase()}`;

export const DefaultNonceManager = Layer.effect(
  NonceManagerService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    const deltas = new Map<string, bigint>();

    const fetchNonce = (address: string) =>
      provider.request<string>({
        method: "starknet_getNonce",
        params: ["pending", address]
      });

    const get = (address: string, chainId: bigint) =>
      Effect.gen(function* () {
        try {
          const onchain = BigInt(yield* fetchNonce(address));
          const key = keyFor(address, chainId);
          const delta = deltas.get(key) ?? 0n;
          return onchain + delta;
        } catch (error) {
          return yield* Effect.fail(
            new NonceError({
              address,
              message: error instanceof Error ? error.message : "Failed to fetch nonce",
              cause: error
            })
          );
        }
      });

    const consume = (address: string, chainId: bigint) =>
      get(address, chainId).pipe(
        Effect.tap((nonce) => {
          const key = keyFor(address, chainId);
          const delta = deltas.get(key) ?? 0n;
          deltas.set(key, delta + 1n);
          return Effect.void;
        })
      );

    const increment = (address: string, chainId: bigint) =>
      Effect.sync(() => {
        const key = keyFor(address, chainId);
        const delta = deltas.get(key) ?? 0n;
        deltas.set(key, delta + 1n);
      });

    const reset = (address: string, chainId: bigint) =>
      Effect.sync(() => {
        deltas.delete(keyFor(address, chainId));
      });

    return {
      get,
      consume,
      increment,
      reset
    };
  })
);
