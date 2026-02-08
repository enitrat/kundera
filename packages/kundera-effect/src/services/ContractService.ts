import { Context, Effect, Layer } from "effect";
import type { ContractAddressType } from "@kundera-sn/kundera-ts";
import {
  compileCalldata,
  decodeOutput,
  type AbiLike,
  type InferArgs,
  type InferFunctionName,
  type InferReturn,
} from "@kundera-sn/kundera-ts/abi";
import type {
  BlockId,
  FeeEstimate,
  SimulatedTransaction,
  SimulationFlag,
  TransactionTrace,
} from "@kundera-sn/kundera-ts/jsonrpc";
import { Rpc } from "@kundera-sn/kundera-ts/jsonrpc";

import { ContractError, type RpcError, type TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";

const parseResponseItem = (
  value: string,
  contractAddress: string,
  functionName: string,
): Effect.Effect<bigint, ContractError> =>
  Effect.try({
    try: () => BigInt(value),
    catch: (cause) =>
      new ContractError({
        contractAddress,
        functionName,
        stage: "decode",
        message: `Invalid felt value returned by provider: ${value}`,
        cause,
      }),
  });

export interface ContractReadOptions {
  readonly blockId?: BlockId;
  readonly requestOptions?: RequestOptions;
}

export interface ContractCallParams<
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
> extends ContractReadOptions {
  readonly contractAddress: ContractAddressType;
  readonly abi: TAbi;
  readonly functionName: TFunctionName;
  readonly args: InferArgs<TAbi, TFunctionName>;
}

export interface ContractInstance<TAbi extends AbiLike> {
  readonly address: ContractAddressType;
  readonly abi: TAbi;
  readonly read: <TFunctionName extends InferFunctionName<TAbi> & string>(
    functionName: TFunctionName,
    args: InferArgs<TAbi, TFunctionName>,
    options?: ContractReadOptions,
  ) => Effect.Effect<
    InferReturn<TAbi, TFunctionName>,
    ContractError | TransportError | RpcError
  >;
  readonly readRaw: <TFunctionName extends InferFunctionName<TAbi> & string>(
    functionName: TFunctionName,
    args: InferArgs<TAbi, TFunctionName>,
    options?: ContractReadOptions,
  ) => Effect.Effect<string[], ContractError | TransportError | RpcError>;
}

export interface ContractServiceShape {
  readonly callRaw: <
    TAbi extends AbiLike,
    TFunctionName extends InferFunctionName<TAbi> & string,
  >(
    params: ContractCallParams<TAbi, TFunctionName>,
  ) => Effect.Effect<string[], ContractError | TransportError | RpcError>;

  readonly call: <
    TAbi extends AbiLike,
    TFunctionName extends InferFunctionName<TAbi> & string,
  >(
    params: ContractCallParams<TAbi, TFunctionName>,
  ) => Effect.Effect<
    InferReturn<TAbi, TFunctionName>,
    ContractError | TransportError | RpcError
  >;

  readonly at: <TAbi extends AbiLike>(
    contractAddress: ContractAddressType,
    abi: TAbi,
  ) => ContractInstance<TAbi>;
}

export class ContractService extends Context.Tag("@kundera/ContractService")<
  ContractService,
  ContractServiceShape
>() {}

export const ContractLive: Layer.Layer<ContractService, never, ProviderService> = Layer.effect(
  ContractService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;

    const callRaw: ContractServiceShape["callRaw"] = (params) =>
      Effect.gen(function* () {
        const contractAddressHex = params.contractAddress.toHex();
        const compiled = compileCalldata(params.abi, params.functionName, params.args);
        if (compiled.error) {
          return yield* Effect.fail(
            new ContractError({
              contractAddress: contractAddressHex,
              functionName: params.functionName,
              stage: "encode",
              message: compiled.error.message,
              cause: compiled.error,
            }),
          );
        }

        const callRequest = {
          contract_address: contractAddressHex,
          entry_point_selector: compiled.result.selectorHex,
          calldata: compiled.result.calldata,
        };

        const { method, params: rpcParams } = Rpc.CallRequest(callRequest, params.blockId ?? "latest");
        return yield* provider.request<string[]>(method, rpcParams, params.requestOptions);
      });

    const call: ContractServiceShape["call"] = (params) =>
      Effect.gen(function* () {
        const contractAddressHex = params.contractAddress.toHex();
        const rawResult = yield* callRaw(params);
        const outputValues = yield* Effect.forEach(rawResult, (item) =>
          parseResponseItem(item, contractAddressHex, params.functionName),
        );

        const decoded = decodeOutput(params.abi, params.functionName, outputValues);
        if (decoded.error) {
          return yield* Effect.fail(
            new ContractError({
              contractAddress: contractAddressHex,
              functionName: params.functionName,
              stage: "decode",
              message: decoded.error.message,
              cause: decoded.error,
            }),
          );
        }

        return decoded.result;
      });

    const at: ContractServiceShape["at"] = (contractAddress, abi) => ({
      address: contractAddress,
      abi,
      read: (functionName, args, options) =>
        call({
          contractAddress,
          abi,
          functionName,
          args,
          blockId: options?.blockId,
          requestOptions: options?.requestOptions,
        }),
      readRaw: (functionName, args, options) =>
        callRaw({
          contractAddress,
          abi,
          functionName,
          args,
          blockId: options?.blockId,
          requestOptions: options?.requestOptions,
        }),
    });

    return {
      callRaw,
      call,
      at,
    } satisfies ContractServiceShape;
  }),
);

export const Contract = <TAbi extends AbiLike>(
  contractAddress: ContractAddressType,
  abi: TAbi,
): Effect.Effect<ContractInstance<TAbi>, never, ContractService> =>
  Effect.map(ContractService, (service) => service.at(contractAddress, abi));

// ---------------------------------------------------------------------------
// Free functions (Voltaire-style: no Contract instance needed)
// ---------------------------------------------------------------------------

export interface ReadContractParams<
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
> extends ContractReadOptions {
  readonly contractAddress: ContractAddressType;
  readonly abi: TAbi;
  readonly functionName: TFunctionName;
  readonly args: InferArgs<TAbi, TFunctionName>;
}

/**
 * Typed contract read without creating a Contract instance.
 *
 * Encodes calldata via ABI, calls `starknet_call`, and decodes the result.
 * Depends on `ContractService` (which itself depends on `ProviderService`).
 */
export const readContract = <
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
>(
  params: ReadContractParams<TAbi, TFunctionName>,
): Effect.Effect<
  InferReturn<TAbi, TFunctionName>,
  ContractError | TransportError | RpcError,
  ContractService
> =>
  Effect.flatMap(ContractService, (service) => service.call(params));

export interface SimulateContractParams<
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
> {
  readonly contractAddress: ContractAddressType;
  readonly abi: TAbi;
  readonly functionName: TFunctionName;
  readonly args: InferArgs<TAbi, TFunctionName>;
  readonly blockId?: BlockId;
  readonly simulationFlags?: readonly SimulationFlag[];
  readonly requestOptions?: RequestOptions;
}

export interface SimulateContractResult {
  readonly transactionTrace: TransactionTrace;
  readonly feeEstimation: FeeEstimate;
}

/**
 * Simulate a contract invocation without sending it on-chain.
 *
 * Encodes calldata via ABI, wraps it in a broadcasted invoke transaction,
 * and calls `starknet_simulateTransactions`. Returns the transaction trace
 * and fee estimation.
 *
 * **Dependency note:** Unlike `readContract` (which depends on `ContractService`),
 * this function depends on `ProviderService` directly because simulation uses a
 * different RPC method (`starknet_simulateTransactions` vs `starknet_call`) and
 * builds the full transaction envelope itself rather than delegating to the
 * ContractService call/encode pipeline.
 */
export const simulateContract = <
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
>(
  params: SimulateContractParams<TAbi, TFunctionName>,
): Effect.Effect<
  SimulateContractResult,
  ContractError | TransportError | RpcError,
  ProviderService
> =>
  Effect.gen(function* () {
    const contractAddressHex = params.contractAddress.toHex();

    const compiled = compileCalldata(params.abi, params.functionName, params.args);
    if (compiled.error) {
      return yield* Effect.fail(
        new ContractError({
          contractAddress: contractAddressHex,
          functionName: params.functionName,
          stage: "encode",
          message: compiled.error.message,
          cause: compiled.error,
        }),
      );
    }

    // Build a minimal V3 broadcasted invoke transaction for simulation.
    // sender_address is set to the target contract (self-call pattern) since
    // simulateContract doesn't require an account — the node ignores it when
    // SKIP_VALIDATE is set. For account-routed simulation, use AccountService.
    const broadcastedTx = {
      type: "INVOKE" as const,
      sender_address: contractAddressHex,
      calldata: [
        // SNIP-6 __execute__ encoding: single call
        "0x1", // number of calls
        contractAddressHex,
        compiled.result.selectorHex,
        `0x${compiled.result.calldata.length.toString(16)}`, // calldata length
        ...compiled.result.calldata,
      ],
      version: "0x3" as const,
      resource_bounds: {
        l1_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
        l2_gas: { max_amount: "0x0", max_price_per_unit: "0x0" },
      },
      signature: [],
      nonce: "0x0",
      tip: "0x0",
      paymaster_data: [],
      account_deployment_data: [],
      nonce_data_availability_mode: "L1" as const,
      fee_data_availability_mode: "L1" as const,
    };

    const provider = yield* ProviderService;
    const { method, params: rpcParams } = Rpc.SimulateTransactionsRequest(
      params.blockId ?? "latest",
      [broadcastedTx],
      [...(params.simulationFlags ?? ["SKIP_VALIDATE", "SKIP_FEE_CHARGE"])],
    );

    const results = yield* provider.request<SimulatedTransaction[]>(
      method,
      rpcParams,
      params.requestOptions,
    );

    if (!results.length) {
      return yield* Effect.fail(
        new ContractError({
          contractAddress: contractAddressHex,
          functionName: params.functionName,
          stage: "simulate",
          message: "starknet_simulateTransactions returned empty results",
        }),
      );
    }
    const result = results[0] as SimulatedTransaction;

    return {
      transactionTrace: result.transaction_trace,
      feeEstimation: result.fee_estimation,
    } satisfies SimulateContractResult;
  });
