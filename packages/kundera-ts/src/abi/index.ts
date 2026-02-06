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
	AbiOutput,
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
} from "./types.js";

// Result helpers
export { ok, err, abiError } from "./types.js";

// Re-export kundera's ABI inference types.
export type {
	StarknetAbi,
	ExtractAbiFunctionNames,
	ExtractAbiFunction,
	ExtractAbiFunctions,
	ExtractAbiEventNames,
	ExtractAbiEvent,
	AbiEventArgs,
	ContractFunctions,
	MapAbiPrimitive,
	StringToPrimitiveType,
	ExtractArgs,
	FunctionRet,
	FunctionArgs,
	InferFunctionName,
	InferArgs,
	InferReturn,
} from "./abi-type-inference.js";

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
} from "./parse.js";

// Encoding
export { encodeValue, encodeArgs, encodeArgsObject } from "./encode.js";

// Decoding
export {
	decodeValue,
	decodeArgs,
	decodeArgsObject,
	decodeOutputs,
	decodeOutputsObject,
} from "./decode.js";

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
} from "./calldata.js";

// Events
export type { EventData } from "./events.js";
export {
	decodeEvent,
	decodeEventBySelector,
	getEventSelector,
	getEventSelectorHex,
} from "./events.js";

// Short string utilities live in primitives — import from '@kundera-sn/kundera-ts' directly

// Class hash utilities (moved from contract module)
export type {
	CompiledSierra,
	CompiledSierraCasm,
	SierraEntryPoint,
	SierraEntryPoints,
	CasmEntryPoint,
	CasmEntryPoints,
	AbiArtifact,
} from "./classHash.js";
export {
	classHashFromSierra,
	compiledClassHashFromCasm,
	extractAbi,
} from "./classHash.js";
