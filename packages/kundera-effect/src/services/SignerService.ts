import { Context, Effect, Layer } from "effect";
import type { Felt252Type } from "@kundera-sn/kundera-ts";
import type { TxnReceiptWithBlockInfo } from "@kundera-sn/kundera-ts/jsonrpc";
import type {
  WalletInvokeParams,
  WalletSwitchChainParams,
  WalletTypedData,
} from "@kundera-sn/kundera-ts/provider";

import type {
  RpcError,
  TransactionError,
  TransportError,
  WalletError,
} from "../errors.js";
import type { RequestOptions } from "./TransportService.js";
import { TransactionService, type SendInvokeAndWaitOptions } from "./TransactionService.js";
import { WalletProviderService, type RequestAccountsOptions } from "./WalletProviderService.js";

export interface SignerServiceShape {
  readonly requestAccounts: (
    options?: RequestAccountsOptions,
  ) => Effect.Effect<string[], WalletError | RpcError>;

  readonly requestChainId: () => Effect.Effect<string, WalletError | RpcError>;

  readonly switchStarknetChain: (
    params: WalletSwitchChainParams,
    options?: RequestOptions,
  ) => Effect.Effect<boolean, WalletError | RpcError>;

  readonly signTypedData: (
    typedData: WalletTypedData,
    options?: RequestOptions,
  ) => Effect.Effect<string[], WalletError | RpcError>;

  readonly sendInvoke: (
    params: WalletInvokeParams,
    options?: RequestOptions,
  ) => Effect.Effect<{ transactionHash: string }, WalletError | RpcError>;

  readonly waitForReceipt: (
    txHash: Felt252Type,
    options?: import("./TransactionService.js").WaitForReceiptOptions,
  ) => Effect.Effect<
    TxnReceiptWithBlockInfo,
    TransportError | RpcError | TransactionError
  >;

  readonly sendInvokeAndWait: (
    params: WalletInvokeParams,
    options?: SendInvokeAndWaitOptions,
  ) => Effect.Effect<
    { transactionHash: string; receipt: TxnReceiptWithBlockInfo },
    WalletError | TransportError | RpcError | TransactionError
  >;
}

export class SignerService extends Context.Tag("@kundera/SignerService")<
  SignerService,
  SignerServiceShape
>() {}

export const SignerLive: Layer.Layer<
  SignerService,
  never,
  WalletProviderService | TransactionService
> = Layer.effect(
  SignerService,
  Effect.gen(function* () {
    const wallet = yield* WalletProviderService;
    const transaction = yield* TransactionService;

    return {
      requestAccounts: wallet.requestAccounts,
      requestChainId: wallet.requestChainId,
      switchStarknetChain: wallet.switchStarknetChain,
      signTypedData: wallet.signTypedData,
      sendInvoke: transaction.sendInvoke,
      waitForReceipt: transaction.waitForReceipt,
      sendInvokeAndWait: transaction.sendInvokeAndWait,
    } satisfies SignerServiceShape;
  }),
);
