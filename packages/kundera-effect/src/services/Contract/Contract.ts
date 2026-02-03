import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Abi from "../../abi/index.js";
import { ProviderService } from "../Provider/index.js";
import { ContractError, ContractService, type ReadContractParams } from "./ContractService.js";

const toHex = (value: bigint | string) =>
  typeof value === "string" ? value : `0x${value.toString(16)}`;

const toBigintArray = (values: string[]): bigint[] => values.map((value) => BigInt(value));

export const ContractLayer = Layer.effect(
  ContractService,
  Effect.gen(function* () {
    const provider = yield* ProviderService;

    const buildCall = (params: ReadContractParams) =>
      Abi.compileCalldata(params.abi, params.functionName, params.args).pipe(
        Effect.map((compiled) => ({
          contractAddress: params.address,
          entrypoint: compiled.selectorHex,
          calldata: compiled.calldata
        })),
        Effect.mapError((error) =>
          new ContractError({
            input: params,
            message: error.message,
            cause: error
          })
        )
      );

    const callRaw = (params: ReadContractParams) =>
      buildCall(params).pipe(
        Effect.flatMap((call) =>
          provider.request<string[]>({
            method: "starknet_call",
            params: [
              {
                contract_address: call.contractAddress,
                entry_point_selector: call.entrypoint,
                calldata: call.calldata.map((value) => toHex(value))
              },
              params.blockId ?? "latest"
            ]
          })
        ),
        Effect.mapError((error) =>
          new ContractError({
            input: params,
            message: error.message,
            cause: error
          })
        )
      );

    const readContract = (params: ReadContractParams) =>
      callRaw(params).pipe(
        Effect.flatMap((output) =>
          Abi.decodeOutputObject(params.abi, params.functionName, toBigintArray(output))
        ),
        Effect.mapError((error) =>
          new ContractError({
            input: params,
            message: error.message,
            cause: error
          })
        )
      );

    return {
      buildCall,
      callRaw,
      readContract
    };
  })
);
