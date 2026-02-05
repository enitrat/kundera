/**
 * Encode single value for SNIP-12 hashing
 *
 * Handles all Cairo types: felt, integers, addresses, arrays, structs.
 */

import type { Felt252Type } from '../../primitives/Felt252/types.js';
import { Felt252 } from '../../primitives/Felt252/index.js';
import { Uint8 } from '../../primitives/Uint8/index.js';
import { Uint16 } from '../../primitives/Uint16/index.js';
import { Uint32 } from '../../primitives/Uint32/index.js';
import { Uint64 } from '../../primitives/Uint64/index.js';
import { Uint128 } from '../../primitives/Uint128/index.js';
import { Uint256 } from '../../primitives/Uint256/index.js';
import { Int8 } from '../../primitives/Int8/index.js';
import { Int16 } from '../../primitives/Int16/index.js';
import { Int32 } from '../../primitives/Int32/index.js';
import { Int64 } from '../../primitives/Int64/index.js';
import { Int128 } from '../../primitives/Int128/index.js';
import { ContractAddress } from '../../primitives/ContractAddress/index.js';
import { ClassHash } from '../../primitives/ClassHash/index.js';
import { encodeShortString } from '../../primitives/ShortString/index.js';
import { poseidonHashMany, snKeccak } from '../hash.js';
// hashType imported for future use in complex type encoding
import { hashType as _hashType } from './hashType.js';
import { Snip12EncodingError } from './errors.js';
import type { TypeDefinitions, MessageValue } from './types.js';

/**
 * Factory for encode value function
 *
 * Uses dependency injection pattern for testability and flexibility.
 */
export function EncodeValue(deps: {
  hashArray: (elements: Felt252Type[]) => Felt252Type;
  hashStruct: (
    typeName: string,
    data: Record<string, MessageValue>,
    types: TypeDefinitions,
  ) => Felt252Type;
}) {
  const { hashArray, hashStruct } = deps;

  /**
   * Encode a single value based on its type
   *
   * @param type - The SNIP-12 type string
   * @param value - The value to encode
   * @param types - Type definitions for struct lookups
   * @returns Encoded value as Felt252 or array of Felt252 (for u256)
   */
  return function encodeValue(
    type: string,
    value: MessageValue,
    types: TypeDefinitions,
  ): Felt252Type | Felt252Type[] {
    // Array types: Type* - must check before other types
    if (type.endsWith('*')) {
      const elementType = type.slice(0, -1);
      const arr = value as MessageValue[];
      if (!Array.isArray(arr)) {
        throw new Snip12EncodingError(`Expected array for type ${type}`, {
          type,
          value,
        });
      }
      // Empty array - hash of empty array is hash of [0] (per SNIP-12)
      if (arr.length === 0) {
        return Felt252(0n);
      }
      const encodedElements: Felt252Type[] = [];
      for (const elem of arr) {
        const encoded = encodeValue(elementType, elem, types);
        if (Array.isArray(encoded)) {
          // u256 returns [low, high]
          encodedElements.push(...encoded);
        } else {
          encodedElements.push(encoded);
        }
      }
      return hashArray(encodedElements);
    }

    // felt / felt252
    if (type === 'felt' || type === 'felt252') {
      return toFelt(value);
    }

    // bool
    if (type === 'bool') {
      return Felt252(value ? 1n : 0n);
    }

    // selector - starknet_keccak of the string
    if (type === 'selector') {
      if (typeof value !== 'string') {
        throw new Snip12EncodingError('selector must be a string', { type, value });
      }
      return snKeccak(value);
    }

    // timestamp - just a felt
    if (type === 'timestamp') {
      return toFelt(value);
    }

    // Unsigned integers
    if (type === 'u8') {
      const v = Uint8.from(toBigInt(value));
      return Uint8.toFelt(v);
    }
    if (type === 'u16') {
      const v = Uint16.from(toBigInt(value));
      return Uint16.toFelt(v);
    }
    if (type === 'u32') {
      const v = Uint32.from(toBigInt(value));
      return Uint32.toFelt(v);
    }
    if (type === 'u64') {
      const v = Uint64.from(toBigInt(value));
      return Uint64.toFelt(v);
    }
    if (type === 'u128') {
      const v = Uint128.from(toBigInt(value));
      return Uint128.toFelt(v);
    }
    // u256 - returns TWO felts [low, high]
    if (type === 'u256') {
      const v = Uint256.from(toBigInt(value));
      return Uint256.toFelts(v);
    }

    // Signed integers
    if (type === 'i8') {
      const v = Int8.from(toBigInt(value));
      return Int8.toFelt(v);
    }
    if (type === 'i16') {
      const v = Int16.from(toBigInt(value));
      return Int16.toFelt(v);
    }
    if (type === 'i32') {
      const v = Int32.from(toBigInt(value));
      return Int32.toFelt(v);
    }
    if (type === 'i64') {
      const v = Int64.from(toBigInt(value));
      return Int64.toFelt(v);
    }
    if (type === 'i128') {
      const v = Int128.from(toBigInt(value));
      return Int128.toFelt(v);
    }

    // ContractAddress - is a branded Felt252, just convert and return
    if (type === 'ContractAddress') {
      // ContractAddress.from accepts same inputs as Felt252
      return ContractAddress.from(toFelt(value)) as unknown as Felt252Type;
    }

    // ClassHash - is a branded Felt252, just convert and return
    if (type === 'ClassHash') {
      // ClassHash.from accepts same inputs as Felt252
      return ClassHash.from(toFelt(value)) as unknown as Felt252Type;
    }

    // shortstring - encode as felt
    if (type === 'shortstring') {
      if (typeof value !== 'string') {
        throw new Snip12EncodingError('shortstring must be a string', { type, value });
      }
      if (value.length > 31) {
        throw new Snip12EncodingError('shortstring must be <= 31 characters', {
          type,
          value,
          length: value.length,
        });
      }
      return encodeShortString(value);
    }

    // string / ByteArray - hash the serialized bytes
    if (type === 'string' || type === 'ByteArray') {
      if (typeof value !== 'string') {
        throw new Snip12EncodingError('string must be a string', { type, value });
      }
      // Encode as array of short strings (31-char chunks)
      const chunks: Felt252Type[] = [];
      for (let i = 0; i < value.length; i += 31) {
        const chunk = value.slice(i, i + 31);
        chunks.push(encodeShortString(chunk));
      }
      // Add length at the end for ByteArray format
      chunks.push(Felt252(BigInt(value.length)));
      return hashArray(chunks);
    }

    // Custom struct type
    if (types[type]) {
      return hashStruct(type, value as Record<string, MessageValue>, types);
    }

    // Unknown type - try as felt
    throw new Snip12EncodingError(`Unknown type: ${type}`, { type, value });
  };
}

/**
 * Convert value to bigint
 */
function toBigInt(value: MessageValue): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  if (typeof value === 'boolean') return value ? 1n : 0n;
  // Check if it's a Felt252Type (has toBigInt method)
  if (value && typeof value === 'object' && 'toBigInt' in value) {
    return (value as { toBigInt(): bigint }).toBigInt();
  }
  throw new Snip12EncodingError('Cannot convert value to bigint', { value });
}

/**
 * Convert value to Felt252
 */
function toFelt(value: MessageValue): Felt252Type {
  if (typeof value === 'bigint') return Felt252(value);
  if (typeof value === 'number') return Felt252(BigInt(value));
  if (typeof value === 'string') return Felt252(value);
  if (typeof value === 'boolean') return Felt252(value ? 1n : 0n);
  // Check if it's already a Felt252Type
  if (value && typeof value === 'object' && 'toBigInt' in value) {
    return value as Felt252Type;
  }
  throw new Snip12EncodingError('Cannot convert value to felt', { value });
}

/**
 * Create default encodeValue with poseidonHashMany
 */
export function createEncodeValue(hashStruct: (
  typeName: string,
  data: Record<string, MessageValue>,
  types: TypeDefinitions,
) => Felt252Type) {
  return EncodeValue({
    hashArray: poseidonHashMany,
    hashStruct,
  });
}
