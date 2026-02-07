import { Context, Effect, Layer, Ref } from "effect";
import type { ContractAddressType, Felt252Type } from "@kundera-sn/kundera-ts";

import { NonceError, type RpcError, type TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export interface NonceRequestOptions {
  readonly chainId?: Felt252Type | string;
  readonly blockId?: unknown;
  readonly requestOptions?: RequestOptions;
}

export interface NonceManagerServiceShape {
  readonly get: (
    address: ContractAddressType | string,
    options?: NonceRequestOptions,
  ) => Effect.Effect<bigint, NonceError | TransportError | RpcError>;

  readonly consume: (
    address: ContractAddressType | string,
    options?: NonceRequestOptions,
  ) => Effect.Effect<bigint, NonceError | TransportError | RpcError>;

  readonly increment: (
    address: ContractAddressType | string,
    chainId: Felt252Type | string,
  ) => Effect.Effect<void>;

  readonly reset: (
    address: ContractAddressType | string,
    chainId: Felt252Type | string,
  ) => Effect.Effect<void>;
}

export class NonceManagerService extends Context.Tag("@kundera/NonceManagerService")<
  NonceManagerService,
  NonceManagerServiceShape
>() {}

const toNonceKey = (chainId: string, address: string): string =>
  `${chainId}:${address.toLowerCase()}`;

const parseNonce = (
  address: string,
  rawNonce: string,
): Effect.Effect<bigint, NonceError> =>
  Effect.try({
    try: () => BigInt(rawNonce),
    catch: (cause) =>
      new NonceError({
        address,
        message: `Invalid nonce returned by provider: ${rawNonce}`,
        cause,
      }),
  });

export const DefaultNonceManagerLive: Layer.Layer<
  NonceManagerService,
  never,
  ProviderService
> = Layer.effect(
  NonceManagerService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    const deltasRef = yield* Ref.make(new Map<string, bigint>());

    const resolveChainId = (
      options?: NonceRequestOptions,
    ): Effect.Effect<string, TransportError | RpcError> =>
      options?.chainId
        ? Effect.succeed(
            typeof options.chainId === "string"
              ? options.chainId
              : options.chainId.toHex(),
          )
        : provider.request<string>("starknet_chainId", [], options?.requestOptions);

    const getDelta = (key: string): Effect.Effect<bigint> =>
      Ref.get(deltasRef).pipe(
        Effect.map((deltas) => deltas.get(key) ?? 0n),
      );

    const setDelta = (key: string, value: bigint): Effect.Effect<void> =>
      Ref.update(deltasRef, (deltas) => {
        const next = new Map(deltas);
        if (value === 0n) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        return next;
      });

    const get: NonceManagerServiceShape["get"] = (address, options) =>
      Effect.gen(function* () {
        const addressHex = typeof address === "string" ? address : address.toHex();
        const chainId = yield* resolveChainId(options);
        const blockId = options?.blockId ?? "pending";
        const key = toNonceKey(chainId, addressHex);

        const onChainNonceHex = yield* provider.request<string>(
          "starknet_getNonce",
          [blockId, addressHex],
          options?.requestOptions,
        );

        const onChainNonce = yield* parseNonce(addressHex, onChainNonceHex);
        const delta = yield* getDelta(key);

        return onChainNonce + delta;
      });

    const consume: NonceManagerServiceShape["consume"] = (address, options) =>
      Effect.gen(function* () {
        const addressHex = typeof address === "string" ? address : address.toHex();
        const chainId = yield* resolveChainId(options);
        const nonce = yield* get(addressHex, {
          ...options,
          chainId,
        });

        const key = toNonceKey(chainId, addressHex);
        const delta = yield* getDelta(key);
        yield* setDelta(key, delta + 1n);

        return nonce;
      });

    const increment: NonceManagerServiceShape["increment"] = (
      address,
      chainId,
    ) =>
      Effect.gen(function* () {
        const addressHex = typeof address === "string" ? address : address.toHex();
        const chainIdHex = typeof chainId === "string" ? chainId : chainId.toHex();
        const key = toNonceKey(chainIdHex, addressHex);
        const delta = yield* getDelta(key);
        yield* setDelta(key, delta + 1n);
      });

    const reset: NonceManagerServiceShape["reset"] = (address, chainId) =>
      setDelta(
        toNonceKey(
          typeof chainId === "string" ? chainId : chainId.toHex(),
          typeof address === "string" ? address : address.toHex(),
        ),
        0n,
      );

    return {
      get,
      consume,
      increment,
      reset,
    } satisfies NonceManagerServiceShape;
  }),
);
