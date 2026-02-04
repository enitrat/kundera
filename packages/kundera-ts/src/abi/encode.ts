/**
 * ABI Encoding
 *
 * Encode Cairo values to calldata (felt array).
 */

import {
  type Felt252Type,
  Felt252,
  FIELD_PRIME,
  encodeShortString,
} from '../primitives/index.js';
import {
  type CairoValue,
  type CairoEnumValue,
  type ParsedAbi,
  type ParsedType,
  type AbiMember,
  type Result,
  ok,
  err,
  abiError,
} from './types.js';
import { parseType, getStruct, getEnum } from './parse.js';

// ============ Value Coercion ============

/**
 * Coerce a JS value to bigint for encoding
 */
function toBigIntValue(value: CairoValue): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'boolean') return value ? 1n : 0n;
  if (typeof value === 'string') {
    // Handle hex strings
    if (value.startsWith('0x')) {
      return BigInt(value);
    }
    // Handle decimal strings
    return BigInt(value);
  }
  if (value instanceof Uint8Array) {
    return Felt252(value as Felt252Type).toBigInt();
  }
  throw new Error(`Cannot convert ${typeof value} to bigint`);
}

// ============ Type Encoding ============

/**
 * Encode a single value according to its type
 */
export function encodeValue(
  value: CairoValue,
  typeStr: string,
  abi: ParsedAbi
): Result<bigint[]> {
  try {
    const parsed = parseType(typeStr);
    const result = encodeByType(value, parsed, abi);
    return ok(result);
  } catch (error) {
    return err(
      abiError(
        'ENCODE_ERROR',
        `Failed to encode value: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Internal: encode by parsed type
 */
function encodeByType(
  value: CairoValue,
  type: ParsedType,
  abi: ParsedAbi
): bigint[] {
  switch (type.kind) {
    case 'primitive':
      return encodePrimitive(value, type.name);

    case 'array':
    case 'span':
      return encodeArray(value as CairoValue[], type.inner!, abi);

    case 'tuple':
      return encodeTuple(value as CairoValue[], type.members!, abi);

    case 'option':
      return encodeOption(value, type.inner!, abi);

    case 'struct': {
      // Check if it's actually an enum (parseType defaults unknown types to struct)
      const enumDef = getEnum(abi, type.path ?? type.name);
      if (enumDef) {
        return encodeEnum(value as CairoEnumValue, type, abi);
      }
      return encodeStruct(value as Record<string, CairoValue>, type, abi);
    }

    case 'enum':
      return encodeEnum(value as CairoEnumValue, type, abi);

    default:
      throw new Error(`Unknown type kind: ${type.kind}`);
  }
}

/**
 * Encode a primitive value
 */
function encodePrimitive(value: CairoValue, typeName: string): bigint[] {
  // Handle u256 specially (2 felts: low, high)
  if (
    typeName === 'u256' ||
    typeName === 'core::integer::u256' ||
    typeName === 'integer::u256'
  ) {
    const bigVal = toBigIntValue(value);
    const mask128 = (1n << 128n) - 1n;
    const low = bigVal & mask128;
    const high = bigVal >> 128n;
    return [low, high];
  }

  // Handle bool
  if (typeName === 'bool' || typeName === 'core::bool') {
    if (typeof value === 'boolean') {
      return [value ? 1n : 0n];
    }
    const bigVal = toBigIntValue(value);
    return [bigVal === 0n ? 0n : 1n];
  }

  // Handle ByteArray
  if (
    typeName === 'ByteArray' ||
    typeName === 'core::byte_array::ByteArray' ||
    typeName === 'byte_array::ByteArray'
  ) {
    return encodeByteArray(value);
  }

  // Handle shortstring (felt252 containing ASCII text)
  if (typeName === 'shortstring' || typeName === 'core::shortstring') {
    if (typeof value === 'string') {
      return [encodeShortString(value).toBigInt()];
    }
    // Already encoded as bigint/number
    const bigVal = toBigIntValue(value);
    return [bigVal];
  }

  // All other primitives encode as single felt
  const bigVal = toBigIntValue(value);
  if (bigVal >= FIELD_PRIME) {
    throw new Error(`Value ${bigVal} exceeds field prime`);
  }
  return [bigVal];
}

/**
 * Encode a ByteArray
 */
function encodeByteArray(value: CairoValue): bigint[] {
  let bytes: Uint8Array;

  if (typeof value === 'string') {
    // Convert string to bytes
    bytes = new TextEncoder().encode(value);
  } else if (value instanceof Uint8Array) {
    bytes = value;
  } else {
    throw new Error('ByteArray must be string or Uint8Array');
  }

  const result: bigint[] = [];

  // Number of full 31-byte words
  const numFullWords = Math.floor(bytes.length / 31);
  result.push(BigInt(numFullWords));

  // Full 31-byte words
  for (let i = 0; i < numFullWords; i++) {
    const chunk = bytes.slice(i * 31, (i + 1) * 31);
    let word = 0n;
    for (const byte of chunk) {
      word = (word << 8n) | BigInt(byte);
    }
    result.push(word);
  }

  // Pending word (remaining bytes)
  const remaining = bytes.length % 31;
  if (remaining > 0) {
    const chunk = bytes.slice(numFullWords * 31);
    let word = 0n;
    for (const byte of chunk) {
      word = (word << 8n) | BigInt(byte);
    }
    result.push(word);
  } else {
    result.push(0n);
  }

  // Pending word length
  result.push(BigInt(remaining));

  return result;
}

/**
 * Encode an array (length-prefixed)
 */
function encodeArray(
  values: CairoValue[],
  elementType: ParsedType,
  abi: ParsedAbi
): bigint[] {
  const result: bigint[] = [BigInt(values.length)];

  for (const value of values) {
    const encoded = encodeByType(value, elementType, abi);
    result.push(...encoded);
  }

  return result;
}

/**
 * Encode a tuple
 */
function encodeTuple(
  values: CairoValue[],
  memberTypes: ParsedType[],
  abi: ParsedAbi
): bigint[] {
  if (values.length !== memberTypes.length) {
    throw new Error(
      `Tuple length mismatch: expected ${memberTypes.length}, got ${values.length}`
    );
  }

  const result: bigint[] = [];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const memberType = memberTypes[i];
    if (value === undefined || !memberType) {
      throw new Error('Tuple encoding failed: missing value or type');
    }
    const encoded = encodeByType(value, memberType, abi);
    result.push(...encoded);
  }

  return result;
}

/**
 * Encode an Option<T>
 */
function encodeOption(
  value: CairoValue,
  innerType: ParsedType,
  abi: ParsedAbi
): bigint[] {
  // None is represented as variant index 1, Some as variant index 0
  if (value === null || value === undefined) {
    return [1n]; // None variant
  }

  // Some variant: index 0 followed by encoded value
  const encoded = encodeByType(value, innerType, abi);
  return [0n, ...encoded];
}

/**
 * Encode a struct
 */
function encodeStruct(
  value: Record<string, CairoValue>,
  type: ParsedType,
  abi: ParsedAbi
): bigint[] {
  // Look up struct definition
  const structDef = getStruct(abi, type.path ?? type.name);
  if (!structDef) {
    throw new Error(`Struct not found: ${type.path ?? type.name}`);
  }

  const result: bigint[] = [];
  for (const member of structDef.entry.members) {
    const memberValue = value[member.name];
    if (memberValue === undefined) {
      throw new Error(`Missing struct member: ${member.name}`);
    }
    const encoded = encodeByType(memberValue, parseType(member.type), abi);
    result.push(...encoded);
  }

  return result;
}

/**
 * Encode an enum
 */
function encodeEnum(
  value: CairoEnumValue,
  type: ParsedType,
  abi: ParsedAbi
): bigint[] {
  // Look up enum definition
  const enumDef = getEnum(abi, type.path ?? type.name);
  if (!enumDef) {
    throw new Error(`Enum not found: ${type.path ?? type.name}`);
  }

  // Find variant index
  const variantIndex = enumDef.entry.variants.findIndex(
    (v) => v.name === value.variant
  );
  if (variantIndex === -1) {
    throw new Error(`Unknown variant: ${value.variant}`);
  }

  const variant = enumDef.entry.variants[variantIndex];
  if (!variant) {
    throw new Error(`Unknown variant index: ${variantIndex}`);
  }
  const result: bigint[] = [BigInt(variantIndex)];

  // Encode variant data if not unit type
  if (variant.type !== '()' && variant.type !== 'unit') {
    const encoded = encodeByType(value.value, parseType(variant.type), abi);
    result.push(...encoded);
  }

  return result;
}

// ============ Function Encoding ============

/**
 * Encode function arguments to calldata
 */
export function encodeArgs(
  inputs: AbiMember[],
  args: CairoValue[],
  abi: ParsedAbi
): Result<bigint[]> {
  if (args.length !== inputs.length) {
    return err(
      abiError(
        'INVALID_ARGS',
        `Argument count mismatch: expected ${inputs.length}, got ${args.length}`
      )
    );
  }

  try {
    const result: bigint[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const arg = args[i];
      if (!input || arg === undefined) {
        throw new Error('Argument encoding failed: missing input or argument');
      }
      const encoded = encodeByType(arg, parseType(input.type), abi);
      result.push(...encoded);
    }

    return ok(result);
  } catch (error) {
    return err(
      abiError(
        'ENCODE_ERROR',
        `Failed to encode arguments: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Encode arguments from an object (by name)
 */
export function encodeArgsObject(
  inputs: AbiMember[],
  argsObj: Record<string, CairoValue>,
  abi: ParsedAbi
): Result<bigint[]> {
  const args: CairoValue[] = [];

  for (const input of inputs) {
    const value = argsObj[input.name];
    if (value === undefined) {
      return err(abiError('INVALID_ARGS', `Missing argument: ${input.name}`));
    }
    args.push(value);
  }

  return encodeArgs(inputs, args, abi);
}
