/**
 * Starknet ABI Types
 *
 * Types for Cairo contract ABI parsing and manipulation.
 */

// ============ Result Type ============

/**
 * Voltaire-style result type for all public API
 */
export type Result<T, E = AbiError> =
  | { result: T; error: null }
  | { result: null; error: E };

/**
 * Create a success result
 */
export function ok<T>(result: T): Result<T, never> {
  return { result, error: null };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { result: null, error };
}

// ============ Error Types ============

export type AbiErrorCode =
  | 'INVALID_ABI'
  | 'FUNCTION_NOT_FOUND'
  | 'EVENT_NOT_FOUND'
  | 'INVALID_ARGS'
  | 'DECODE_ERROR'
  | 'ENCODE_ERROR'
  | 'ACCOUNT_REQUIRED'
  | 'RPC_ERROR';

export interface AbiError {
  code: AbiErrorCode;
  message: string;
  details?: unknown;
}

export function abiError(
  code: AbiErrorCode,
  message: string,
  details?: unknown
): AbiError {
  return { code, message, details };
}

// ============ Cairo Type System ============

/**
 * Cairo type string representations
 */
export type CairoType =
  | 'felt252'
  | 'core::felt252'
  | 'core::integer::u8'
  | 'core::integer::u16'
  | 'core::integer::u32'
  | 'core::integer::u64'
  | 'core::integer::u128'
  | 'core::integer::u256'
  | 'core::integer::i8'
  | 'core::integer::i16'
  | 'core::integer::i32'
  | 'core::integer::i64'
  | 'core::integer::i128'
  | 'core::bool'
  | 'core::starknet::contract_address::ContractAddress'
  | 'core::starknet::class_hash::ClassHash'
  | 'core::byte_array::ByteArray'
  | string; // For arrays, structs, tuples, enums

/**
 * Parsed Cairo type information
 */
export interface ParsedType {
  kind: 'primitive' | 'array' | 'tuple' | 'struct' | 'enum' | 'option' | 'span';
  name: string;
  /** For arrays/spans: the element type */
  inner?: ParsedType;
  /** For tuples: member types */
  members?: ParsedType[];
  /** For structs/enums: the full type path */
  path?: string;
}

// ============ ABI Entry Types ============

/**
 * Function state mutability
 */
export type StateMutability = 'view' | 'external';

/**
 * ABI member (function input/output)
 */
export interface AbiMember {
  name: string;
  type: string;
}

/**
 * ABI function entry
 */
export interface AbiFunctionEntry {
  type: 'function';
  name: string;
  inputs: AbiMember[];
  outputs: AbiMember[];
  state_mutability: StateMutability;
}

/**
 * ABI struct member
 */
export interface AbiStructMember {
  name: string;
  type: string;
}

/**
 * ABI struct entry
 */
export interface AbiStructEntry {
  type: 'struct';
  name: string;
  members: AbiStructMember[];
}

/**
 * ABI enum variant
 */
export interface AbiEnumVariant {
  name: string;
  type: string;
}

/**
 * ABI enum entry
 */
export interface AbiEnumEntry {
  type: 'enum';
  name: string;
  variants: AbiEnumVariant[];
}

/**
 * ABI event member
 */
export interface AbiEventMember {
  name: string;
  type: string;
  kind: 'key' | 'data' | 'nested' | 'flat';
}

/**
 * ABI event entry
 */
export interface AbiEventEntry {
  type: 'event';
  name: string;
  kind: 'struct' | 'enum';
  members?: AbiEventMember[];
  variants?: AbiEnumVariant[];
}

/**
 * ABI L1 handler entry
 */
export interface AbiL1HandlerEntry {
  type: 'l1_handler';
  name: string;
  inputs: AbiMember[];
  outputs: AbiMember[];
  state_mutability: StateMutability;
}

/**
 * ABI constructor entry
 */
export interface AbiConstructorEntry {
  type: 'constructor';
  name: string;
  inputs: AbiMember[];
}

/**
 * ABI interface entry
 */
export interface AbiInterfaceEntry {
  type: 'interface';
  name: string;
  items: AbiEntry[];
}

/**
 * ABI impl entry
 */
export interface AbiImplEntry {
  type: 'impl';
  name: string;
  interface_name: string;
}

/**
 * Any ABI entry
 */
export type AbiEntry =
  | AbiFunctionEntry
  | AbiStructEntry
  | AbiEnumEntry
  | AbiEventEntry
  | AbiL1HandlerEntry
  | AbiConstructorEntry
  | AbiInterfaceEntry
  | AbiImplEntry;

/**
 * Full ABI (array of entries)
 */
export type Abi = AbiEntry[];

// ============ Parsed ABI ============

/**
 * Indexed function for quick lookup
 */
export interface IndexedFunction {
  entry: AbiFunctionEntry;
  selector: bigint;
  selectorHex: string;
}

/**
 * Indexed event for quick lookup
 */
export interface IndexedEvent {
  entry: AbiEventEntry;
  selector: bigint;
  selectorHex: string;
}

/**
 * Indexed struct for quick lookup
 */
export interface IndexedStruct {
  entry: AbiStructEntry;
}

/**
 * Indexed enum for quick lookup
 */
export interface IndexedEnum {
  entry: AbiEnumEntry;
}

/**
 * Parsed and indexed ABI for efficient access
 */
export interface ParsedAbi {
  /** Original ABI */
  raw: Abi;
  /** Functions by name (overloads are indexed as name_0, name_1, etc.) */
  functions: Map<string, IndexedFunction>;
  /** Functions by selector hex */
  functionsBySelector: Map<string, IndexedFunction>;
  /** Events by name */
  events: Map<string, IndexedEvent>;
  /** Events by selector hex */
  eventsBySelector: Map<string, IndexedEvent>;
  /** Structs by name */
  structs: Map<string, IndexedStruct>;
  /** Enums by name */
  enums: Map<string, IndexedEnum>;
  /** Constructor if present */
  constructor?: AbiConstructorEntry;
}

// ============ Value Types ============

/**
 * Cairo value types for encoding/decoding
 */
export type CairoValue =
  | bigint
  | number
  | string
  | boolean
  | Uint8Array
  | null
  | CairoValue[]
  | { [key: string]: CairoValue }
  | CairoEnumValue;

/**
 * Enum value representation
 */
export interface CairoEnumValue {
  variant: string;
  value: CairoValue;
}

/**
 * Decoded struct value
 */
export interface DecodedStruct {
  [key: string]: CairoValue;
}

/**
 * Decoded event
 */
export interface DecodedEvent {
  name: string;
  args: DecodedStruct;
}

// ============ Contract Types ============

/**
 * Call object for transaction population
 */
export interface Call {
  contractAddress: string;
  entrypoint: string;
  calldata: bigint[];
}

/**
 * Fee estimate result
 */
export interface FeeEstimate {
  gasConsumed: bigint;
  gasPrice: bigint;
  overallFee: bigint;
}
