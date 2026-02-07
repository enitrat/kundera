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
import type { BlockId } from "@kundera-sn/kundera-ts/jsonrpc";

import { ContractError, type RpcError, type TransportError } from "../errors.js";
import { ProviderService } from "./ProviderService.js";
import type { RequestOptions } from "./TransportService.js";
import { bigintToHex } from "./wire.js";

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
          calldata: compiled.result.calldata.map(bigintToHex),
        };

        return yield* provider.request<string[]>(
          "starknet_call",
          [callRequest, params.blockId ?? "latest"],
          params.requestOptions,
        );
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
