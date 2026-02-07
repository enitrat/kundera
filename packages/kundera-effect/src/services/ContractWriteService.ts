import { Context, Effect, Layer } from "effect";
import type { ContractAddressType } from "@kundera-sn/kundera-ts";
import {
  compileCalldata,
  type AbiLike,
  type InferArgs,
  type InferFunctionName,
} from "@kundera-sn/kundera-ts/abi";
import type {
  BroadcastedDeclareTxn,
  BroadcastedDeployAccountTxn,
  BroadcastedInvokeTxn,
  FeeEstimate,
  SimulationFlag,
} from "@kundera-sn/kundera-ts/jsonrpc";
import type { WalletInvokeParams } from "@kundera-sn/kundera-ts/provider";

import {
  ContractError,
  type RpcError,
  type TransactionError,
  type TransportError,
  type WalletError,
} from "../errors.js";
import { FeeEstimatorService } from "./FeeEstimatorService.js";
import type { RequestOptions } from "./TransportService.js";
import { TransactionService, type WaitForReceiptOptions } from "./TransactionService.js";

const bigintToHex = (value: bigint): string => `0x${value.toString(16)}`;

type EstimatableTransaction =
  | BroadcastedInvokeTxn
  | BroadcastedDeclareTxn
  | BroadcastedDeployAccountTxn;

export interface EstimateContractWriteFeeOptions {
  readonly simulationFlags?: readonly SimulationFlag[];
  readonly blockId?: import("@kundera-sn/kundera-ts/jsonrpc").BlockId;
  readonly requestOptions?: RequestOptions;
}

export interface ContractInvokeOptions {
  readonly requestOptions?: RequestOptions;
}

export interface ContractInvokeAndWaitOptions extends WaitForReceiptOptions {
  readonly invokeOptions?: RequestOptions;
}

export interface ContractWriteParams<
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
> {
  readonly contractAddress: ContractAddressType | string;
  readonly abi: TAbi;
  readonly functionName: TFunctionName;
  readonly args: InferArgs<TAbi, TFunctionName>;
}

export interface ContractWriteServiceShape {
  readonly invoke: (
    params: WalletInvokeParams,
    options?: ContractInvokeOptions,
  ) => Effect.Effect<{ transactionHash: string }, WalletError | RpcError>;

  readonly invokeAndWait: (
    params: WalletInvokeParams,
    options?: ContractInvokeAndWaitOptions,
  ) => Effect.Effect<
    {
      transactionHash: string;
      receipt: import("@kundera-sn/kundera-ts/jsonrpc").TxnReceiptWithBlockInfo;
    },
    WalletError | TransportError | RpcError | TransactionError
  >;

  readonly estimateFee: (
    transactions: readonly EstimatableTransaction[],
    options?: EstimateContractWriteFeeOptions,
  ) => Effect.Effect<FeeEstimate[], TransportError | RpcError>;

  readonly invokeContract: <
    TAbi extends AbiLike,
    TFunctionName extends InferFunctionName<TAbi> & string,
  >(
    params: ContractWriteParams<TAbi, TFunctionName>,
    options?: ContractInvokeOptions,
  ) => Effect.Effect<{ transactionHash: string }, ContractError | WalletError | RpcError>;

  readonly invokeContractAndWait: <
    TAbi extends AbiLike,
    TFunctionName extends InferFunctionName<TAbi> & string,
  >(
    params: ContractWriteParams<TAbi, TFunctionName>,
    options?: ContractInvokeAndWaitOptions,
  ) => Effect.Effect<
    {
      transactionHash: string;
      receipt: import("@kundera-sn/kundera-ts/jsonrpc").TxnReceiptWithBlockInfo;
    },
    ContractError | WalletError | TransportError | RpcError | TransactionError
  >;
}

export class ContractWriteService extends Context.Tag("@kundera/ContractWriteService")<
  ContractWriteService,
  ContractWriteServiceShape
>() {}

const toWalletInvokeParams = <
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
>(
  params: ContractWriteParams<TAbi, TFunctionName>,
): Effect.Effect<WalletInvokeParams, ContractError> =>
  Effect.gen(function* () {
    const contractAddressHex =
      typeof params.contractAddress === "string"
        ? params.contractAddress
        : params.contractAddress.toHex();

    const compiled = compileCalldata(params.abi, params.functionName, params.args);
    if (compiled.error) {
      return yield* Effect.fail(
        new ContractError({
          contractAddress: contractAddressHex,
          functionName: params.functionName,
          stage: "encode",
          message: compiled.error.message,
          details: compiled.error,
        }),
      );
    }

    return {
      calls: [
        {
          contract_address: contractAddressHex,
          entry_point: params.functionName,
          calldata: compiled.result.calldata.map(bigintToHex),
        },
      ],
    } satisfies WalletInvokeParams;
  });

export const ContractWriteLive: Layer.Layer<
  ContractWriteService,
  never,
  TransactionService | FeeEstimatorService
> = Layer.effect(
  ContractWriteService,
  Effect.gen(function* () {
    const transactions = yield* TransactionService;
    const feeEstimator = yield* FeeEstimatorService;

    const invoke: ContractWriteServiceShape["invoke"] = (params, options) =>
      transactions.sendInvoke(params, options?.requestOptions);

    const invokeAndWait: ContractWriteServiceShape["invokeAndWait"] = (
      params,
      options,
    ) =>
      transactions.sendInvokeAndWait(params, {
        invokeOptions: options?.invokeOptions,
        pollIntervalMs: options?.pollIntervalMs,
        maxAttempts: options?.maxAttempts,
        requestOptions: options?.requestOptions,
      });

    const estimateFee: ContractWriteServiceShape["estimateFee"] = (
      txs,
      options,
    ) =>
      feeEstimator.estimate(txs, {
        simulationFlags: options?.simulationFlags,
        blockId: options?.blockId,
        requestOptions: options?.requestOptions,
      });

    const invokeContract: ContractWriteServiceShape["invokeContract"] = (
      params,
      options,
    ) =>
      Effect.flatMap(toWalletInvokeParams(params), (invokeParams) =>
        invoke(invokeParams, options),
      );

    const invokeContractAndWait: ContractWriteServiceShape["invokeContractAndWait"] = (
      params,
      options,
    ) =>
      Effect.flatMap(toWalletInvokeParams(params), (invokeParams) =>
        invokeAndWait(invokeParams, options),
      );

    return {
      invoke,
      invokeAndWait,
      estimateFee,
      invokeContract,
      invokeContractAndWait,
    } satisfies ContractWriteServiceShape;
  }),
);
