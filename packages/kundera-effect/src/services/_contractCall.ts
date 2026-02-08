import { Effect } from "effect";
import type { ContractAddressType } from "@kundera-sn/kundera-ts";
import {
  compileCalldata,
  type AbiLike,
  type InferArgs,
  type InferFunctionName,
} from "@kundera-sn/kundera-ts/abi";

import { ContractError } from "../errors.js";

export interface ContractCalldataParams<
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
> {
  readonly contractAddress: ContractAddressType;
  readonly abi: TAbi;
  readonly functionName: TFunctionName;
  readonly args: InferArgs<TAbi, TFunctionName>;
}

export interface CompiledContractCall {
  readonly contractAddressHex: string;
  readonly selectorHex: string;
  readonly calldata: readonly string[];
}

export const compileContractCall = <
  TAbi extends AbiLike,
  TFunctionName extends InferFunctionName<TAbi> & string,
>(
  params: ContractCalldataParams<TAbi, TFunctionName>,
): Effect.Effect<CompiledContractCall, ContractError> =>
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

    return {
      contractAddressHex,
      selectorHex: compiled.result.selectorHex,
      calldata: compiled.result.calldata,
    } satisfies CompiledContractCall;
  });
