import { Context, Effect, Layer, Ref } from "effect";
import {
  createRequest,
  isJsonRpcError,
  walletTransport,
} from "@kundera-sn/kundera-ts/transport";
import type {
  StarknetWindowObject,
  WalletAddChainParams,
  WalletDeclareParams,
  WalletDeploymentData,
  WalletInvokeParams,
  WalletSwitchChainParams,
  WalletTypedData,
  WalletWatchAssetParams,
} from "@kundera-sn/kundera-ts/provider";

import { RpcError, WalletError } from "../errors.js";
import type { RequestOptions } from "./TransportService.js";

export interface RequestAccountsOptions {
  readonly silent_mode?: boolean;
  readonly silentMode?: boolean;
}

export interface WalletProviderServiceShape {
  readonly request: <T>(
    method: string,
    params?: unknown,
    options?: RequestOptions,
  ) => Effect.Effect<T, WalletError | RpcError>;

  readonly supportedWalletApi: () => Effect.Effect<string[], WalletError | RpcError>;
  readonly supportedSpecs: () => Effect.Effect<string[], WalletError | RpcError>;
  readonly getPermissions: () => Effect.Effect<string[], WalletError | RpcError>;

  readonly requestAccounts: (
    options?: RequestAccountsOptions,
  ) => Effect.Effect<string[], WalletError | RpcError>;

  readonly requestChainId: () => Effect.Effect<string, WalletError | RpcError>;
  readonly deploymentData: () => Effect.Effect<WalletDeploymentData, WalletError | RpcError>;

  readonly watchAsset: (
    params: WalletWatchAssetParams,
    options?: RequestOptions,
  ) => Effect.Effect<boolean, WalletError | RpcError>;

  readonly addStarknetChain: (
    params: WalletAddChainParams,
    options?: RequestOptions,
  ) => Effect.Effect<boolean, WalletError | RpcError>;

  readonly switchStarknetChain: (
    params: WalletSwitchChainParams,
    options?: RequestOptions,
  ) => Effect.Effect<boolean, WalletError | RpcError>;

  readonly addInvokeTransaction: (
    params: WalletInvokeParams,
    options?: RequestOptions,
  ) => Effect.Effect<{ transaction_hash: string }, WalletError | RpcError>;

  readonly addDeclareTransaction: (
    params: WalletDeclareParams,
    options?: RequestOptions,
  ) => Effect.Effect<{ transaction_hash: string; class_hash: string }, WalletError | RpcError>;

  readonly signTypedData: (
    typedData: WalletTypedData,
    options?: RequestOptions,
  ) => Effect.Effect<string[], WalletError | RpcError>;
}

export class WalletProviderService extends Context.Tag(
  "@kundera/WalletProviderService",
)<WalletProviderService, WalletProviderServiceShape>() {}

const normalizeRequestAccounts = (
  options?: RequestAccountsOptions,
): { silent_mode?: boolean } | undefined => {
  if (!options) {
    return undefined;
  }

  if (options.silent_mode !== undefined) {
    return { silent_mode: options.silent_mode };
  }

  if (options.silentMode !== undefined) {
    return { silent_mode: options.silentMode };
  }

  return undefined;
};

/**
 * Known limitation: retry FiberRefs (withRetries, withRetrySchedule) have no
 * effect on wallet calls. Only `RequestOptions.timeoutMs` is forwarded to the
 * underlying wallet transport. Retry/backoff must be handled by the caller.
 */
const makeWalletProviderService = (
  swo: StarknetWindowObject,
): Effect.Effect<WalletProviderServiceShape> =>
  Effect.gen(function* () {
    const transport = walletTransport(swo);
    const requestIdRef = yield* Ref.make(0);

    const nextRequestId = Ref.updateAndGet(requestIdRef, (n) => n + 1);

    const request = <T>(
      method: string,
      params?: unknown,
      options?: RequestOptions,
    ): Effect.Effect<T, WalletError | RpcError> =>
      Effect.gen(function* () {
        const id = yield* nextRequestId;
        const payload = createRequest(
          method,
          params === undefined ? [] : [params],
          id,
        );

        const response = yield* Effect.tryPromise({
          try: () =>
            transport.request<T>(
              payload,
              options?.timeoutMs ? { timeout: options.timeoutMs } : undefined,
            ),
          catch: (cause) =>
            new WalletError({
              operation: method,
              message: "Wallet request failed",
              cause,
            }),
        });

        if (isJsonRpcError(response)) {
          return yield* Effect.fail(
            new RpcError({
              method,
              code: response.error.code,
              message: response.error.message,
              data: response.error.data,
            }),
          );
        }

        // Trust boundary: wallet RPC responses are assumed to match the
        // caller-declared generic type for that method.
        return response.result as T;
      });

    const supportedWalletApi: WalletProviderServiceShape["supportedWalletApi"] = () =>
      request("wallet_supportedWalletApi");

    const supportedSpecs: WalletProviderServiceShape["supportedSpecs"] = () =>
      request("wallet_supportedSpecs");

    const getPermissions: WalletProviderServiceShape["getPermissions"] = () =>
      request("wallet_getPermissions");

    const requestAccounts: WalletProviderServiceShape["requestAccounts"] = (
      options,
    ) => request("wallet_requestAccounts", normalizeRequestAccounts(options));

    const requestChainId: WalletProviderServiceShape["requestChainId"] = () =>
      request("wallet_requestChainId");

    const deploymentData: WalletProviderServiceShape["deploymentData"] = () =>
      request("wallet_deploymentData");

    const watchAsset: WalletProviderServiceShape["watchAsset"] = (
      params,
      options,
    ) => request("wallet_watchAsset", params, options);

    const addStarknetChain: WalletProviderServiceShape["addStarknetChain"] = (
      params,
      options,
    ) => request("wallet_addStarknetChain", params, options);

    const switchStarknetChain: WalletProviderServiceShape["switchStarknetChain"] = (
      params,
      options,
    ) => request("wallet_switchStarknetChain", params, options);

    const addInvokeTransaction: WalletProviderServiceShape["addInvokeTransaction"] = (
      params,
      options,
    ) => request("wallet_addInvokeTransaction", params, options);

    const addDeclareTransaction: WalletProviderServiceShape["addDeclareTransaction"] = (
      params,
      options,
    ) => request("wallet_addDeclareTransaction", params, options);

    const signTypedData: WalletProviderServiceShape["signTypedData"] = (
      typedData,
      options,
    ) => request("wallet_signTypedData", typedData, options);

    return {
      request,
      supportedWalletApi,
      supportedSpecs,
      getPermissions,
      requestAccounts,
      requestChainId,
      deploymentData,
      watchAsset,
      addStarknetChain,
      switchStarknetChain,
      addInvokeTransaction,
      addDeclareTransaction,
      signTypedData,
    } satisfies WalletProviderServiceShape;
  });

export const WalletProviderLive = (
  swo: StarknetWindowObject,
): Layer.Layer<WalletProviderService> =>
  Layer.effect(WalletProviderService, makeWalletProviderService(swo));
