import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type { Abi, CairoValue } from "kundera-sn/abi";
import type { AddInvokeTransactionResult } from "kundera-sn/jsonrpc";
import type { ResourceBoundsInput } from "../Account/AccountService.js";
import type { InvokeParams } from "../Signer/SignerService.js";
import type { NonceManagerService } from "../NonceManager/NonceManagerService.js";

export type ContractWriteCall = {
  contractAddress: string;
  entrypoint: string;
  calldata: bigint[];
};

export type BuildCallParams = {
  abi: Abi;
  address: string;
  functionName: string;
  args: CairoValue[] | Record<string, CairoValue>;
};

export type WriteContractParams = BuildCallParams & {
  resourceBounds: ResourceBoundsInput;
  tip?: bigint;
  paymasterData?: bigint[];
  accountDeploymentData?: bigint[];
  nonce?: bigint;
  chainId?: bigint;
};

export type InvokeCallsParams = Omit<InvokeParams, "calls"> & {
  calls: ContractWriteCall[];
};

export class ContractWriteError extends Data.TaggedError("ContractWriteError")<{
  readonly input: unknown;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type ContractWriteShape = {
  buildCall: (params: BuildCallParams) => Effect.Effect<ContractWriteCall, ContractWriteError>;
  invoke: (
    params: InvokeCallsParams
  ) => Effect.Effect<AddInvokeTransactionResult, ContractWriteError, NonceManagerService>;
  writeContract: (
    params: WriteContractParams
  ) => Effect.Effect<AddInvokeTransactionResult, ContractWriteError, NonceManagerService>;
};

export class ContractWriteService extends Context.Tag("ContractWriteService")<
  ContractWriteService,
  ContractWriteShape
>() {}
