import type * as Effect from "effect/Effect";
import type {
  Abi as KanabiAbi,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
  ExtractAbiFunctions,
  ExtractArgs,
  FunctionRet
} from "abi-wan-kanabi/kanabi";
import type { ContractAddressType } from "@kundera-sn/kundera-ts/ContractAddress";
import type { ResourceBoundsInput } from "../Account/AccountService.js";
import type { AddInvokeTransactionResult } from "@kundera-sn/kundera-ts/jsonrpc";
import type { ContractError, ContractService } from "./ContractService.js";
import type { ContractWriteError, ContractWriteService } from "../ContractWrite/ContractWriteService.js";

export type StarknetAbi = KanabiAbi;

type ExtractViewFunctions<TAbi extends StarknetAbi> = Extract<
  ExtractAbiFunctions<TAbi>,
  { type: "function"; state_mutability: "view" }
>;

type ExtractWriteFunctions<TAbi extends StarknetAbi> = Extract<
  ExtractAbiFunctions<TAbi>,
  { type: "function"; state_mutability: "external" }
>;

type FunctionReturn<
  TAbi extends StarknetAbi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>
> = ExtractAbiFunction<TAbi, TFunctionName>["outputs"] extends readonly []
  ? void
  : ExtractAbiFunction<TAbi, TFunctionName>["outputs"] extends readonly [any]
    ? FunctionRet<TAbi, TFunctionName>
    : readonly unknown[];

export type ContractReadMethods<TAbi extends StarknetAbi> = {
  [F in ExtractViewFunctions<TAbi> as F["name"] extends string
    ? F["name"]
    : never]: (
    ...args: ExtractArgs<TAbi, F>
  ) => Effect.Effect<
    FunctionReturn<TAbi, F["name"] & ExtractAbiFunctionNames<TAbi>>,
    ContractError,
    ContractService
  >;
};

export interface WriteOptions {
  readonly resourceBounds: ResourceBoundsInput;
  readonly tip?: bigint;
  readonly paymasterData?: bigint[];
  readonly accountDeploymentData?: bigint[];
  readonly nonce?: bigint;
  readonly chainId?: bigint;
}

type WriteMethodArgs<TInputs> = TInputs extends readonly unknown[]
  ? TInputs extends readonly []
    ? [options: WriteOptions]
    : [...args: TInputs, options: WriteOptions]
  : [options: WriteOptions];

export type ContractWriteMethods<TAbi extends StarknetAbi> = {
  [F in ExtractWriteFunctions<TAbi> as F["name"] extends string
    ? F["name"]
    : never]: (
    ...args: WriteMethodArgs<ExtractArgs<TAbi, F>>
  ) => Effect.Effect<AddInvokeTransactionResult, ContractWriteError, ContractWriteService>;
};

export type ContractSimulateMethods<TAbi extends StarknetAbi> = {
  [F in ExtractWriteFunctions<TAbi> as F["name"] extends string
    ? F["name"]
    : never]: (
    ...args: ExtractArgs<TAbi, F>
  ) => Effect.Effect<
    FunctionReturn<TAbi, F["name"] & ExtractAbiFunctionNames<TAbi>>,
    ContractError,
    ContractService
  >;
};

export interface ContractInstance<TAbi extends StarknetAbi> {
  readonly address: ContractAddressType | string;
  readonly abi: TAbi;
  readonly read: ContractReadMethods<TAbi>;
  readonly write: ContractWriteMethods<TAbi>;
  readonly simulate: ContractSimulateMethods<TAbi>;
}
