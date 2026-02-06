import { Effect } from "effect";
import type {
  Abi as KanabiAbi,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
  ExtractArgs
} from "abi-wan-kanabi/kanabi";
import {
  abiError,
  type Abi,
  type AbiError,
  type AbiErrorCode,
  type AbiEntry,
  type AbiFunctionEntry,
  type AbiStructEntry,
  type AbiEnumEntry,
  type AbiEventEntry,
  type AbiL1HandlerEntry,
  type AbiConstructorEntry,
  type AbiInterfaceEntry,
  type AbiImplEntry,
  type AbiMember,
  type AbiStructMember,
  type AbiEnumVariant,
  type AbiEventMember,
  type StateMutability,
  type ParsedAbi,
  type ParsedType,
  type IndexedFunction,
  type IndexedEvent,
  type IndexedStruct,
  type IndexedEnum,
  type CairoType,
  type CairoValue,
  type CairoEnumValue,
  type DecodedStruct,
  type DecodedEvent,
  type Call,
  type FeeEstimate,
  type Result,
  type EventData,
  type CompiledSierra,
  type CompiledSierraCasm,
  type SierraEntryPoint,
  type SierraEntryPoints,
  type CasmEntryPoint,
  type CasmEntryPoints,
  type AbiArtifact
} from "@kundera-sn/kundera-ts/abi";
import {
  parseAbi as parseAbiBase,
  parseType as parseTypeBase,
  computeSelector as computeSelectorBase,
  computeSelectorHex as computeSelectorHexBase,
  getFunction as getFunctionBase,
  getEvent as getEventBase,
  getStruct as getStructBase,
  getEnum as getEnumBase,
  encodeValue as encodeValueBase,
  encodeArgs as encodeArgsBase,
  encodeArgsObject as encodeArgsObjectBase,
  decodeValue as decodeValueBase,
  decodeArgs as decodeArgsBase,
  decodeArgsObject as decodeArgsObjectBase,
  decodeOutputs as decodeOutputsBase,
  decodeOutputsObject as decodeOutputsObjectBase,
  encodeCalldata as encodeCalldataBase,
  decodeCalldata as decodeCalldataBase,
  decodeCalldataObject as decodeCalldataObjectBase,
  decodeOutput as decodeOutputBase,
  decodeOutputObject as decodeOutputObjectBase,
  compileCalldata as compileCalldataBase,
  getFunctionSelector as getFunctionSelectorBase,
  getFunctionSelectorHex as getFunctionSelectorHexBase,
  decodeEvent as decodeEventBase,
  decodeEventBySelector as decodeEventBySelectorBase,
  getEventSelector as getEventSelectorBase,
  getEventSelectorHex as getEventSelectorHexBase,
  classHashFromSierra as classHashFromSierraBase,
  compiledClassHashFromCasm as compiledClassHashFromCasmBase,
  extractAbi as extractAbiBase,
} from "@kundera-sn/kundera-ts/abi";
import {
  encodeShortString,
  decodeShortString,
  MAX_SHORT_STRING_LENGTH
} from "@kundera-sn/kundera-ts";
import { fromResult } from "../utils/fromResult.js";

const encodeCalldataBaseUntyped = encodeCalldataBase as (
  abi: Abi,
  fnName: string,
  args: CairoValue[] | Record<string, CairoValue>
) => Result<bigint[], AbiError>;

const compileCalldataBaseUntyped = compileCalldataBase as (
  abi: Abi,
  fnName: string,
  args: CairoValue[] | Record<string, CairoValue>
) => Result<{ selector: bigint; selectorHex: string; calldata: bigint[] }, AbiError>;

const decodeOutputBaseUntyped = decodeOutputBase as (
  abi: Abi,
  fnName: string,
  output: bigint[]
) => Result<CairoValue[], AbiError>;

const decodeOutputObjectBaseUntyped = decodeOutputObjectBase as (
  abi: Abi,
  fnName: string,
  output: bigint[]
) => Result<DecodedStruct, AbiError>;

export type {
  Abi,
  AbiError,
  AbiErrorCode,
  AbiEntry,
  AbiFunctionEntry,
  AbiStructEntry,
  AbiEnumEntry,
  AbiEventEntry,
  AbiL1HandlerEntry,
  AbiConstructorEntry,
  AbiInterfaceEntry,
  AbiImplEntry,
  AbiMember,
  AbiStructMember,
  AbiEnumVariant,
  AbiEventMember,
  StateMutability,
  ParsedAbi,
  ParsedType,
  IndexedFunction,
  IndexedEvent,
  IndexedStruct,
  IndexedEnum,
  CairoType,
  CairoValue,
  CairoEnumValue,
  DecodedStruct,
  DecodedEvent,
  Call,
  FeeEstimate,
  EventData,
  CompiledSierra,
  CompiledSierraCasm,
  SierraEntryPoint,
  SierraEntryPoints,
  CasmEntryPoint,
  CasmEntryPoints,
  AbiArtifact
};

export { abiError, encodeShortString, decodeShortString, MAX_SHORT_STRING_LENGTH };

const tryAbi = <T>(
  operation: string,
  input: unknown,
  code: AbiErrorCode,
  thunk: () => T
): Effect.Effect<T, AbiError> =>
  Effect.try({
    try: thunk,
    catch: (error) =>
      abiError(
        code,
        `Failed to ${operation}: ${error instanceof Error ? error.message : "unknown error"}`,
        {
          input,
          cause: error instanceof Error ? error : undefined
        }
      )
  });

export const parseAbi = (abi: Abi) => fromResult(parseAbiBase(abi));
export const parseType = (typeStr: string) => parseTypeBase(typeStr);

export const computeSelector = (name: string) =>
  tryAbi("computeSelector", { name }, "ENCODE_ERROR", () => computeSelectorBase(name));
export const computeSelectorHex = (name: string) =>
  tryAbi("computeSelectorHex", { name }, "ENCODE_ERROR", () =>
    computeSelectorHexBase(name)
  );

export const getFunction = (abi: ParsedAbi, nameOrSelector: string) =>
  fromResult(getFunctionBase(abi, nameOrSelector));
export const getEvent = (abi: ParsedAbi, nameOrSelector: string) =>
  fromResult(getEventBase(abi, nameOrSelector));
export const getStruct = (abi: ParsedAbi, name: string) => getStructBase(abi, name);
export const getEnum = (abi: ParsedAbi, name: string) => getEnumBase(abi, name);

export const encodeValue = (value: CairoValue, typeStr: string, abi: ParsedAbi) =>
  fromResult(encodeValueBase(value, typeStr, abi));
export const encodeArgs = (args: CairoValue[], inputs: AbiMember[], abi: ParsedAbi) =>
  fromResult(encodeArgsBase(inputs, args, abi));
export const encodeArgsObject = (
  args: Record<string, CairoValue>,
  inputs: AbiMember[],
  abi: ParsedAbi
) => fromResult(encodeArgsObjectBase(inputs, args, abi));

export const decodeValue = (
  data: bigint[],
  typeStr: string,
  abi: ParsedAbi,
  offset = 0
) => {
  if (offset === 0) {
    return fromResult(decodeValueBase(data, typeStr, abi));
  }

  const sliced = data.slice(offset);
  const result = decodeValueBase(sliced, typeStr, abi);
  if (result.error) {
    return fromResult(result);
  }

  return fromResult({
    result: { value: result.result.value, consumed: result.result.consumed + offset },
    error: null
  });
};

export const decodeArgs = (data: bigint[], inputs: AbiMember[], abi: ParsedAbi) =>
  fromResult(decodeArgsBase(data, inputs, abi));
export const decodeArgsObject = (data: bigint[], inputs: AbiMember[], abi: ParsedAbi) =>
  fromResult(decodeArgsObjectBase(data, inputs, abi));
export const decodeOutputs = (data: bigint[], outputs: AbiMember[], abi: ParsedAbi) =>
  fromResult(decodeOutputsBase(data, outputs, abi));
export const decodeOutputsObject = (
  data: bigint[],
  outputs: AbiMember[],
  abi: ParsedAbi
) => fromResult(decodeOutputsObjectBase(data, outputs, abi));

export function encodeCalldata<
  TAbi extends KanabiAbi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>
>(
  abi: TAbi,
  fnName: TFunctionName,
  args: ExtractArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>>
): Effect.Effect<bigint[], AbiError>;
export function encodeCalldata(
  abi: Abi,
  fnName: string,
  args: CairoValue[] | Record<string, CairoValue>
): Effect.Effect<bigint[], AbiError>;
export function encodeCalldata(
  abi: Abi,
  fnName: string,
  args: CairoValue[] | Record<string, CairoValue>
): Effect.Effect<bigint[], AbiError> {
  return fromResult(encodeCalldataBaseUntyped(abi, fnName, args));
}
export const decodeCalldata = (
  abi: Abi,
  fnName: string,
  calldata: bigint[]
) => fromResult(decodeCalldataBase(abi, fnName, calldata));
export const decodeCalldataObject = (
  abi: Abi,
  fnName: string,
  calldata: bigint[]
) => fromResult(decodeCalldataObjectBase(abi, fnName, calldata));
export const decodeOutput = (abi: Abi, fnName: string, output: bigint[]) =>
  fromResult(decodeOutputBaseUntyped(abi, fnName, output));
export const decodeOutputObject = (abi: Abi, fnName: string, output: bigint[]) =>
  fromResult(decodeOutputObjectBaseUntyped(abi, fnName, output));
export function compileCalldata<
  TAbi extends KanabiAbi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>
>(
  abi: TAbi,
  fnName: TFunctionName,
  args: ExtractArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>>
): Effect.Effect<{ selector: bigint; selectorHex: string; calldata: bigint[] }, AbiError>;
export function compileCalldata(
  abi: Abi,
  fnName: string,
  args: CairoValue[] | Record<string, CairoValue>
): Effect.Effect<{ selector: bigint; selectorHex: string; calldata: bigint[] }, AbiError>;
export function compileCalldata(
  abi: Abi,
  fnName: string,
  args: CairoValue[] | Record<string, CairoValue>
): Effect.Effect<{ selector: bigint; selectorHex: string; calldata: bigint[] }, AbiError> {
  return fromResult(compileCalldataBaseUntyped(abi, fnName, args));
}

export const getFunctionSelector = (fnName: string) =>
  tryAbi("getFunctionSelector", { fnName }, "ENCODE_ERROR", () =>
    getFunctionSelectorBase(fnName)
  );
export const getFunctionSelectorHex = (fnName: string) =>
  tryAbi("getFunctionSelectorHex", { fnName }, "ENCODE_ERROR", () =>
    getFunctionSelectorHexBase(fnName)
  );

export const decodeEvent = (
  abi: Abi,
  eventName: string,
  data: EventData
) => fromResult(decodeEventBase(abi, eventName, data));
export const decodeEventBySelector = (abi: Abi, data: EventData) =>
  fromResult(decodeEventBySelectorBase(abi, data));

export const getEventSelector = (eventName: string) =>
  tryAbi("getEventSelector", { eventName }, "ENCODE_ERROR", () =>
    getEventSelectorBase(eventName)
  );
export const getEventSelectorHex = (eventName: string) =>
  tryAbi("getEventSelectorHex", { eventName }, "ENCODE_ERROR", () =>
    getEventSelectorHexBase(eventName)
  );

export const classHashFromSierra = (sierra: CompiledSierra) =>
  fromResult(classHashFromSierraBase(sierra));
export const compiledClassHashFromCasm = (casm: CompiledSierraCasm) =>
  fromResult(compiledClassHashFromCasmBase(casm));
export const extractAbi = (artifact: AbiArtifact) => fromResult(extractAbiBase(artifact));
