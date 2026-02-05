/**
 * Starknet ABI Module
 *
 * ABI parsing, calldata encoding/decoding, and event decoding.
 *
 * @example
 * ```ts
 * import { encodeCalldata, decodeEvent } from '@kundera-sn/kundera-ts/abi';
 *
 * // Encode function calldata
 * const result = encodeCalldata(abi, 'transfer', [recipient, amount]);
 * if (result.error) {
 *   console.error(result.error.message);
 * }
 *
 * // Decode event
 * const event = decodeEvent(abi, 'Transfer', { keys, data });
 * ```
 */

/// <reference path="./kanabi-config.d.ts" />

// Types
export type {
  // Result types
  Result,
  AbiError,
  AbiErrorCode,
  // ABI types
  Abi,
  AbiLike,
  AbiEntry,
  AbiExtendedEntry,
  AbiWithL1Handler,
  AbiFunctionEntry,
  AbiStructEntry,
  AbiEnumEntry,
  AbiEventEntry,
  AbiEventStructEntry,
  AbiEventEnumEntry,
  AbiL1HandlerEntry,
  AbiConstructorEntry,
  AbiInterfaceEntry,
  AbiImplEntry,
  AbiMember,
  AbiStructMember,
  AbiEnumVariant,
  AbiEventMember,
  StateMutability,
  // Parsed types
  ParsedAbi,
  ParsedType,
  IndexedFunction,
  IndexedEvent,
  IndexedStruct,
  IndexedEnum,
  // Value types
  CairoType,
  CairoValue,
  CairoEnumValue,
  DecodedStruct,
  DecodedEvent,
  // Contract types
  Call,
  FeeEstimate,
} from './types.js';

// Result helpers
export { ok, err, abiError } from './types.js';

import type {
  Abi as KanabiAbi,
  ExtractAbiFunctionNames,
  ExtractAbiFunction,
  ExtractArgs as KanabiExtractArgs,
  FunctionRet as KanabiFunctionRet,
  StringToPrimitiveType as KanabiStringToPrimitiveType,
  ContractFunctions,
} from 'abi-wan-kanabi/kanabi';
import type { Felt252Type } from '../primitives/Felt252/types.js';
import type { ContractAddressType } from '../primitives/ContractAddress/types.js';
import type { EthAddressType } from '../primitives/EthAddress/types.js';
import type { ClassHashType } from '../primitives/ClassHash/types.js';
import type { Uint256Type } from '../primitives/Uint256/types.js';

type MapAbiPrimitive<TAbi extends KanabiAbi, TType extends string> =
  TType extends 'core::felt252' ? Felt252Type :
  TType extends 'core::starknet::contract_address::ContractAddress' ? ContractAddressType :
  TType extends 'core::starknet::eth_address::EthAddress' ? EthAddressType :
  TType extends 'core::starknet::class_hash::ClassHash' ? ClassHashType :
  TType extends 'core::integer::u256' ? Uint256Type :
  KanabiStringToPrimitiveType<TAbi, TType>;

type BuildArgs<
  TAbi extends KanabiAbi,
  TInputs extends readonly { type: string }[],
  R extends unknown[] = []
> = R['length'] extends TInputs['length']
  ? R
  : BuildArgs<
      TAbi,
      TInputs,
      [...R, MapAbiPrimitive<TAbi, TInputs[R['length']]['type']>]
    >;

// Type utilities for building typed contract wrappers.
export type {
  KanabiAbi,
  ExtractAbiFunctionNames,
  ExtractAbiFunction,
  ContractFunctions,
};

export type StringToPrimitiveType<TAbi extends KanabiAbi, T extends string> =
  MapAbiPrimitive<TAbi, T>;

export type ExtractArgs<
  TAbi extends KanabiAbi,
  TAbiFunction extends ExtractAbiFunction<TAbi, ExtractAbiFunctionNames<TAbi>>
> = KanabiExtractArgs<TAbi, TAbiFunction>;

export type FunctionRet<
  TAbi extends KanabiAbi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>
> = ExtractAbiFunction<TAbi, TFunctionName>['outputs'] extends readonly []
  ? void
  : ExtractAbiFunction<TAbi, TFunctionName>['outputs'][0] extends {
        type: infer TType extends string;
      }
    ? MapAbiPrimitive<TAbi, TType>
    : KanabiFunctionRet<TAbi, TFunctionName>;

export type FunctionArgs<
  TAbi extends KanabiAbi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>
> = ExtractAbiFunction<TAbi, TFunctionName>['inputs'] extends readonly []
  ? []
  : BuildArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>['inputs']> extends [
        infer TSingle,
      ]
    ? TSingle
    : BuildArgs<TAbi, ExtractAbiFunction<TAbi, TFunctionName>['inputs']>;

// Parsing
export {
  parseAbi,
  parseType,
  computeSelector,
  computeSelectorHex,
  getFunction,
  getEvent,
  getStruct,
  getEnum,
} from './parse.js';

// Encoding
export { encodeValue, encodeArgs, encodeArgsObject } from './encode.js';

// Decoding
export {
  decodeValue,
  decodeArgs,
  decodeArgsObject,
  decodeOutputs,
  decodeOutputsObject,
} from './decode.js';

// Calldata (high-level API)
export {
  encodeCalldata,
  decodeCalldata,
  decodeCalldataObject,
  decodeOutput,
  decodeOutputObject,
  compileCalldata,
  getFunctionSelector,
  getFunctionSelectorHex,
} from './calldata.js';

// Events
export type {
  EventData,
} from './events.js';
export {
  decodeEvent,
  decodeEventBySelector,
  getEventSelector,
  getEventSelectorHex,
} from './events.js';

// Short string utilities (re-exported from primitives)
export {
  encodeShortString,
  decodeShortString,
  MAX_SHORT_STRING_LENGTH,
} from '../primitives/index.js';

// Class hash utilities (moved from contract module)
export type {
  CompiledSierra,
  CompiledSierraCasm,
  SierraEntryPoint,
  SierraEntryPoints,
  CasmEntryPoint,
  CasmEntryPoints,
  AbiArtifact,
} from './classHash.js';
export {
  classHashFromSierra,
  compiledClassHashFromCasm,
  extractAbi,
} from './classHash.js';
