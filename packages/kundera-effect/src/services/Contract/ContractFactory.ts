import * as Effect from "effect/Effect";
import * as Abi from "../../abi/index.js";
import type {
  Abi as KunderaAbi,
  AbiEntry,
  AbiFunctionEntry,
  CairoValue
} from "@kundera-sn/kundera-ts/abi";
import type { ContractAddressType } from "@kundera-sn/kundera-ts/ContractAddress";
import { ContractService } from "./ContractService.js";
import { ContractError } from "./ContractService.js";
import { ContractWriteError, ContractWriteService } from "../ContractWrite/ContractWriteService.js";
import type {
  ContractInstance,
  StarknetAbi,
  WriteOptions
} from "./ContractTypes.js";

const toBigintArray = (values: string[]): bigint[] => values.map((value) => BigInt(value));

const isWriteOptions = (value: unknown): value is WriteOptions =>
  typeof value === "object" &&
  value !== null &&
  "resourceBounds" in value &&
  typeof (value as { resourceBounds?: unknown }).resourceBounds === "object";

const normalizeReturn = (
  fn: AbiFunctionEntry,
  decoded: CairoValue[]
): CairoValue | readonly CairoValue[] | undefined => {
  const outputCount = fn.outputs?.length ?? 0;
  if (outputCount === 0) return undefined;
  if (outputCount === 1) return decoded[0];
  return decoded;
};

const getFunctionEntries = (abi: readonly AbiEntry[]) =>
  abi.filter((entry): entry is AbiFunctionEntry => entry.type === "function");

export type ContractFactory = <TAbi extends StarknetAbi>(
  address: ContractAddressType | string,
  abi: TAbi
) => Effect.Effect<ContractInstance<TAbi>>;

export const ContractFactory: ContractFactory = <TAbi extends StarknetAbi>(
  address: ContractAddressType | string,
  abi: TAbi
) => {
  const abiEntries = abi as unknown as readonly AbiEntry[];
  const functions = getFunctionEntries(abiEntries);
  const viewFunctions = functions.filter((fn) => fn.state_mutability === "view");
  const writeFunctions = functions.filter((fn) => fn.state_mutability === "external");
  const addressHex = typeof address === "string" ? address : address.toHex();

  const read = {} as ContractInstance<TAbi>["read"];
  for (const fn of viewFunctions) {
    (
  read as unknown as Record<string, (...args: unknown[]) => Effect.Effect<unknown>>
    )[fn.name] = (...args: unknown[]) =>
      Effect.gen(function* () {
        const contract = yield* ContractService;
        const output = yield* contract.callRaw({
          abi: abi as unknown as KunderaAbi,
          address: addressHex,
          functionName: fn.name,
          args: args as CairoValue[]
        });
        const decoded = yield* Abi.decodeOutput(
          abi as unknown as KunderaAbi,
          fn.name,
          toBigintArray(output)
        ).pipe(
          Effect.mapError(
            (error) =>
              new ContractError({
                input: { address: addressHex, functionName: fn.name, args },
                message: error.message,
                cause: error
              })
          )
        );
        return normalizeReturn(fn, decoded);
      });
  }

  const simulate = {} as ContractInstance<TAbi>["simulate"];
  for (const fn of writeFunctions) {
    (
  simulate as unknown as Record<string, (...args: unknown[]) => Effect.Effect<unknown>>
    )[fn.name] = (...args: unknown[]) =>
      Effect.gen(function* () {
        const contract = yield* ContractService;
        const output = yield* contract.callRaw({
          abi: abi as unknown as KunderaAbi,
          address: addressHex,
          functionName: fn.name,
          args: args as CairoValue[]
        });
        const decoded = yield* Abi.decodeOutput(
          abi as unknown as KunderaAbi,
          fn.name,
          toBigintArray(output)
        ).pipe(
          Effect.mapError(
            (error) =>
              new ContractError({
                input: { address: addressHex, functionName: fn.name, args, simulate: true },
                message: error.message,
                cause: error
              })
          )
        );
        return normalizeReturn(fn, decoded);
      });
  }

  const write = {} as ContractInstance<TAbi>["write"];
  for (const fn of writeFunctions) {
    const inputCount = fn.inputs?.length ?? 0;
    (
  write as unknown as Record<string, (...args: unknown[]) => Effect.Effect<unknown>>
    )[fn.name] = (...argsAndOptions: unknown[]) =>
      Effect.gen(function* () {
        const contractWrite = yield* ContractWriteService;
        const lastArg = argsAndOptions[argsAndOptions.length - 1];
        const hasOptions = isWriteOptions(lastArg) && argsAndOptions.length > inputCount;
        const args = hasOptions ? argsAndOptions.slice(0, -1) : argsAndOptions;
        const options = hasOptions ? (lastArg as WriteOptions) : undefined;

        if (!options?.resourceBounds) {
          return yield* Effect.fail(
            new ContractWriteError({
              input: { address: addressHex, functionName: fn.name, args },
              message: `Missing write options for ${fn.name}. Expected { resourceBounds, ... }.`
            })
          );
        }

        return yield* contractWrite.writeContract({
          abi: abi as unknown as KunderaAbi,
          address: addressHex,
          functionName: fn.name,
          args: args as CairoValue[],
          resourceBounds: options.resourceBounds,
          tip: options.tip,
          paymasterData: options.paymasterData,
          accountDeploymentData: options.accountDeploymentData,
          nonce: options.nonce,
          chainId: options.chainId
        });
      });
  }

  return Effect.succeed({
    address,
    abi,
    read,
    write,
    simulate
  } as ContractInstance<TAbi>);
};
