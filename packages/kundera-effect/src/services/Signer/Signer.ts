import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { AccountService } from "../Account/AccountService.js";
import { ProviderService } from "../Provider/index.js";
import { NonceManagerService } from "../NonceManager/NonceManagerService.js";
import { SignerError, SignerService, type InvokeParams } from "./SignerService.js";

const toBigInt = (value: string | bigint) =>
  typeof value === "string" ? BigInt(value) : value;

export const Signer = Layer.effect(
  SignerService,
  Effect.gen(function* () {
    const account = yield* AccountService;
    const provider = yield* ProviderService;

    const resolveChainId = (params: InvokeParams) =>
      params.chainId !== undefined
        ? Effect.succeed(params.chainId)
        : provider
            .request<string>({ method: "starknet_chainId", params: [] })
            .pipe(Effect.map((chainId) => toBigInt(chainId)));

    const resolveNonce = (params: InvokeParams, chainId: bigint) =>
      params.nonce !== undefined
        ? Effect.succeed(params.nonce)
        : Effect.serviceOption(NonceManagerService).pipe(
            Effect.flatMap((maybeNonceManager) =>
              maybeNonceManager._tag === "Some"
                ? maybeNonceManager.value.consume(account.address, toBigInt(chainId))
                : provider
                    .request<string>({
                      method: "starknet_getNonce",
                      params: ["pending", account.address]
                    })
                    .pipe(Effect.map((nonce) => toBigInt(nonce)))
            )
          );

    const invoke = (params: InvokeParams) =>
      Effect.gen(function* () {
        const chainId = yield* resolveChainId(params);
        const nonce = yield* resolveNonce(params, chainId);

        const tx = yield* account.signInvokeV3({
          ...params,
          nonce,
          chainId
        });

        return yield* provider.request({
          method: "starknet_addInvokeTransaction",
          params: [tx]
        });
      }).pipe(
        Effect.mapError((error) =>
          new SignerError({
            input: params,
            message: error.message,
            cause: error
          })
        )
      );

    return { invoke };
  })
);
