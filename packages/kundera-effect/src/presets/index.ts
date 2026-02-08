import type { StarknetWindowObject } from "@kundera-sn/kundera-ts/provider";
import type { HttpTransportOptions } from "@kundera-sn/kundera-ts/transport";

import { HttpProviderLive } from "../services/ProviderService.js";
import {
  FallbackHttpProviderFromUrls,
  type FallbackProviderEndpoint,
  FallbackHttpProviderLive,
  type WalletTransactionStackOptions,
  WalletBaseStack,
  WalletTransactionStack,
} from "../services/index.js";
import { TestProvider } from "../testing/index.js";

export const STARKNET_MAINNET_RPC =
  "https://starknet-mainnet.public.blastapi.io/rpc/v0_8";
export const STARKNET_SEPOLIA_RPC =
  "https://starknet-sepolia.public.blastapi.io/rpc/v0_8";
export const STARKNET_DEVNET_RPC = "http://127.0.0.1:5050/rpc";

export const createProvider = (url: string, options?: HttpTransportOptions) =>
  HttpProviderLive(url, options);

export const createFallbackProvider = (
  endpoints: readonly [FallbackProviderEndpoint, ...FallbackProviderEndpoint[]],
) => FallbackHttpProviderLive(endpoints);

export { FallbackHttpProviderFromUrls as FallbackProvider };

export { TestProvider as TestProviderPreset };

export const MainnetProvider = (options?: HttpTransportOptions) =>
  HttpProviderLive(STARKNET_MAINNET_RPC, options);

export const SepoliaProvider = (options?: HttpTransportOptions) =>
  HttpProviderLive(STARKNET_SEPOLIA_RPC, options);

export const DevnetProvider = (options?: HttpTransportOptions) =>
  HttpProviderLive(STARKNET_DEVNET_RPC, options);

export interface WalletStackPresetOptions {
  readonly swo: StarknetWindowObject;
  readonly rpcUrl?: string;
  readonly rpcTransportOptions?: HttpTransportOptions;
}

const toWalletStackOptions = (
  options: WalletStackPresetOptions,
  defaultUrl: string,
): WalletTransactionStackOptions => ({
  swo: options.swo,
  rpcUrl: options.rpcUrl ?? defaultUrl,
  rpcTransportOptions: options.rpcTransportOptions,
});

export const MainnetWalletBaseStack = (options: WalletStackPresetOptions) =>
  WalletBaseStack(toWalletStackOptions(options, STARKNET_MAINNET_RPC));

export const SepoliaWalletBaseStack = (options: WalletStackPresetOptions) =>
  WalletBaseStack(toWalletStackOptions(options, STARKNET_SEPOLIA_RPC));

export const DevnetWalletBaseStack = (options: WalletStackPresetOptions) =>
  WalletBaseStack(toWalletStackOptions(options, STARKNET_DEVNET_RPC));

export const MainnetWalletStack = (options: WalletStackPresetOptions) =>
  WalletTransactionStack(toWalletStackOptions(options, STARKNET_MAINNET_RPC));

export const SepoliaWalletStack = (options: WalletStackPresetOptions) =>
  WalletTransactionStack(toWalletStackOptions(options, STARKNET_SEPOLIA_RPC));

export const DevnetWalletStack = (options: WalletStackPresetOptions) =>
  WalletTransactionStack(toWalletStackOptions(options, STARKNET_DEVNET_RPC));
