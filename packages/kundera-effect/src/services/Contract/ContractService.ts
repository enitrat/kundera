import * as Context from "effect/Context";
import { Schema } from "effect";
import type * as Effect from "effect/Effect";
import type { Abi, CairoValue, DecodedStruct } from "@kundera-sn/kundera-ts/abi";

export type ContractCallInput = {
  contractAddress: string;
  entrypoint: string;
  calldata: bigint[];
};

export type ReadContractParams = {
  abi: Abi;
  address: string;
  functionName: string;
  args: CairoValue[] | Record<string, CairoValue>;
  blockId?: string | { block_number: number } | { block_hash: string };
};

export class ContractError extends Schema.TaggedError<ContractError>()(
  "ContractError",
  {
    input: Schema.Unknown,
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export type ContractShape = {
  readonly buildCall: (
    params: ReadContractParams
  ) => Effect.Effect<ContractCallInput, ContractError>;
  readonly callRaw: (
    params: ReadContractParams
  ) => Effect.Effect<string[], ContractError>;
  readonly readContract: (
    params: ReadContractParams
  ) => Effect.Effect<DecodedStruct, ContractError>;
};

export class ContractService extends Context.Tag("ContractService")<
  ContractService,
  ContractShape
>() {}
