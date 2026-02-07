import { Effect, Layer } from "effect";

import { RpcError } from "../../errors.js";
import { ProviderService, type ProviderServiceShape } from "../ProviderService.js";
import {
  WalletProviderService,
  type WalletProviderServiceShape,
} from "../WalletProviderService.js";

export const makeMockWalletProvider = (
  overrides?: Partial<WalletProviderServiceShape>,
): Layer.Layer<WalletProviderService> =>
  Layer.succeed(WalletProviderService, {
    request: () => Effect.succeed(null as never),
    supportedWalletApi: () => Effect.succeed([]),
    supportedSpecs: () => Effect.succeed([]),
    getPermissions: () => Effect.succeed([]),
    requestAccounts: () => Effect.succeed(["0xabc"]),
    requestChainId: () => Effect.succeed("0x534e5f5345504f4c4941"),
    deploymentData: () =>
      Effect.succeed({
        address: "0xabc",
        class_hash: "0x1",
        salt: "0x2",
        calldata: ["0x3"],
        version: 1,
      }),
    watchAsset: () => Effect.succeed(true),
    addStarknetChain: () => Effect.succeed(true),
    switchStarknetChain: () => Effect.succeed(true),
    addInvokeTransaction: () => Effect.succeed({ transaction_hash: "0xdeadbeef" }),
    addDeclareTransaction: () =>
      Effect.succeed({ transaction_hash: "0xdead", class_hash: "0xbeef" }),
    signTypedData: () => Effect.succeed(["0x1", "0x2"]),
    ...overrides,
  } satisfies WalletProviderServiceShape);

export const makeMockProvider = (
  responses: Record<string, unknown>,
): Layer.Layer<ProviderService> =>
  Layer.succeed(ProviderService, {
    request: <T>(method: string) =>
      method in responses
        ? Effect.succeed(responses[method] as T)
        : Effect.fail(
            new RpcError({
              method,
              code: -32601,
              message: `No mock for ${method}`,
            }),
          ),
  } satisfies ProviderServiceShape);
