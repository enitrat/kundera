import { Context, Effect, Layer, Ref } from "effect";
import type { ContractAddressType, Felt252Type } from "@kundera-sn/kundera-ts";
import { Rpc, type BlockId } from "@kundera-sn/kundera-ts/jsonrpc";

import { NonceError, type RpcError, type TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export interface NonceRequestOptions {
  readonly chainId?: Felt252Type;
  readonly blockId?: BlockId;
  readonly requestOptions?: RequestOptions;
}

export interface NonceManagerServiceShape {
  readonly get: (
    address: ContractAddressType,
    options?: NonceRequestOptions,
  ) => Effect.Effect<bigint, NonceError | TransportError | RpcError>;

  readonly consume: (
    address: ContractAddressType,
    options?: NonceRequestOptions,
  ) => Effect.Effect<bigint, NonceError | TransportError | RpcError>;

  readonly increment: (
    address: ContractAddressType,
    chainId: Felt252Type,
  ) => Effect.Effect<void>;

  readonly reset: (
    address: ContractAddressType,
    chainId: Felt252Type,
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
    ): Effect.Effect<string, TransportError | RpcError> => {
      if (options?.chainId) return Effect.succeed(options.chainId.toHex());
      const { method, params } = Rpc.ChainIdRequest();
      return provider.request<string>(method, params, options?.requestOptions);
    };

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
        const addressHex = address.toHex();
        const chainId = yield* resolveChainId(options);
        const blockId = options?.blockId ?? "pending";
        const key = toNonceKey(chainId, addressHex);

        const nonceReq = Rpc.GetNonceRequest(blockId, addressHex);
        const onChainNonceHex = yield* provider.request<string>(
          nonceReq.method,
          nonceReq.params,
          options?.requestOptions,
        );

        const onChainNonce = yield* parseNonce(addressHex, onChainNonceHex);
        const delta = yield* getDelta(key);

        return onChainNonce + delta;
      });

    const consume: NonceManagerServiceShape["consume"] = (address, options) =>
      Effect.gen(function* () {
        const addressHex = address.toHex();
        const chainId = yield* resolveChainId(options);
        const blockId = options?.blockId ?? "pending";
        const key = toNonceKey(chainId, addressHex);
        const nonceReq = Rpc.GetNonceRequest(blockId, addressHex);
        const onChainNonceHex = yield* provider.request<string>(
          nonceReq.method,
          nonceReq.params,
          options?.requestOptions,
        );
        const onChainNonce = yield* parseNonce(addressHex, onChainNonceHex);

        // Atomic read-and-increment via Ref.modify to prevent duplicate nonces
        // when multiple fibers call consume() concurrently for the same address.
        const delta = yield* Ref.modify(deltasRef, (deltas) => {
          const currentDelta = deltas.get(key) ?? 0n;
          const next = new Map(deltas);
          next.set(key, currentDelta + 1n);
          return [currentDelta, next] as const;
        });

        return onChainNonce + delta;
      });

    const increment: NonceManagerServiceShape["increment"] = (
      address,
      chainId,
    ) => {
      const key = toNonceKey(chainId.toHex(), address.toHex());
      return Ref.update(deltasRef, (deltas) => {
        const currentDelta = deltas.get(key) ?? 0n;
        const next = new Map(deltas);
        next.set(key, currentDelta + 1n);
        return next;
      });
    };

    const reset: NonceManagerServiceShape["reset"] = (address, chainId) =>
      setDelta(
        toNonceKey(chainId.toHex(), address.toHex()),
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
