import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Abi from "../../abi/index.js";
import { SignerService } from "../Signer/SignerService.js";
import {
  ContractWriteError,
  ContractWriteService,
  type BuildCallParams,
  type ContractWriteCall,
  type InvokeCallsParams,
  type WriteContractParams
} from "./ContractWriteService.js";

export const ContractWrite = Layer.effect(
  ContractWriteService,
  Effect.gen(function* () {
    const signer = yield* SignerService;

    const buildCall = (params: BuildCallParams) =>
      Abi.compileCalldata(params.abi, params.functionName, params.args).pipe(
        Effect.map((compiled) => ({
          contractAddress: params.address,
          entrypoint: compiled.selectorHex,
          calldata: compiled.calldata
        })),
        Effect.mapError((error) =>
          new ContractWriteError({
            input: params,
            message: error.message,
            cause: error
          })
        )
      );

    const invoke = (params: InvokeCallsParams) =>
      signer
        .invoke({
          calls: params.calls,
          resourceBounds: params.resourceBounds,
          tip: params.tip,
          paymasterData: params.paymasterData,
          accountDeploymentData: params.accountDeploymentData,
          nonce: params.nonce,
          chainId: params.chainId
        })
        .pipe(
          Effect.mapError((error) =>
            new ContractWriteError({
              input: params,
              message: error.message,
              cause: error
            })
          )
        );

    const writeContract = (params: WriteContractParams) =>
      buildCall(params).pipe(
        Effect.flatMap((call: ContractWriteCall) =>
          invoke({
            calls: [call],
            resourceBounds: params.resourceBounds,
            tip: params.tip,
            paymasterData: params.paymasterData,
            accountDeploymentData: params.accountDeploymentData,
            nonce: params.nonce,
            chainId: params.chainId
          })
        )
      );

    return {
      buildCall,
      invoke,
      writeContract
    };
  })
);
