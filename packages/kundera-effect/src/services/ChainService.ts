import { Context, Effect, Layer } from "effect";
import type { Felt252Type } from "@kundera-sn/kundera-ts";

import type { RpcError, TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

export type StarknetNetworkName =
  | "mainnet"
  | "sepolia"
  | "integration"
  | "devnet"
  | "unknown";

export interface ChainServiceShape {
  readonly chainId: (
    options?: RequestOptions,
  ) => Effect.Effect<Felt252Type | string, TransportError | RpcError>;

  readonly networkName: (
    options?: RequestOptions,
  ) => Effect.Effect<StarknetNetworkName, TransportError | RpcError>;

  readonly rpcUrl: () => string;
}

export class ChainService extends Context.Tag("@kundera/ChainService")<
  ChainService,
  ChainServiceShape
>() {}

export interface ChainLiveOptions {
  readonly rpcUrl: string;
}

const normalizeChainId = (chainId: Felt252Type | string): string =>
  (typeof chainId === "string" ? chainId : chainId.toHex()).toLowerCase();

const networkFromChainId = (chainId: string): StarknetNetworkName => {
  if (chainId === "0x534e5f4d41494e") {
    return "mainnet";
  }

  if (chainId === "0x534e5f5345504f4c4941") {
    return "sepolia";
  }

  if (chainId === "0x534e5f494e544547524154494f4e") {
    return "integration";
  }

  return "unknown";
};

const inferDevnetFromRpcUrl = (rpcUrl: string): boolean =>
  rpcUrl.includes("127.0.0.1") ||
  rpcUrl.includes("localhost") ||
  rpcUrl.includes("0.0.0.0");

export const ChainLive = (
  options: ChainLiveOptions,
): Layer.Layer<ChainService, never, ProviderService> =>
  Layer.effect(
    ChainService,
    Effect.gen(function* () {
      const provider = yield* ProviderService;

      const chainId: ChainServiceShape["chainId"] = (requestOptions) =>
        provider.request("starknet_chainId", [], requestOptions);

      const networkName: ChainServiceShape["networkName"] = (requestOptions) =>
        Effect.map(chainId(requestOptions), (chainIdValue) => {
          const fromChainId = networkFromChainId(normalizeChainId(chainIdValue));
          if (fromChainId !== "unknown") {
            return fromChainId;
          }

          return inferDevnetFromRpcUrl(options.rpcUrl) ? "devnet" : "unknown";
        });

      return {
        chainId,
        networkName,
        rpcUrl: () => options.rpcUrl,
      } satisfies ChainServiceShape;
    }),
  );
