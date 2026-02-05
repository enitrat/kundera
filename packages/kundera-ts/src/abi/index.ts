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


// Types
export type {
  // Result types
  Result,
  AbiError,
  AbiErrorCode,
  // ABI types
  Abi,
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

// Type utilities for building typed contract wrappers (from abi-wan-kanabi)
export type {
  Abi as KanabiAbi,
  ExtractAbiFunctionNames,
  ExtractAbiFunction,
  ExtractArgs,
  FunctionRet,
  FunctionArgs,
  ContractFunctions,
  StringToPrimitiveType,
} from 'abi-wan-kanabi/kanabi';

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
