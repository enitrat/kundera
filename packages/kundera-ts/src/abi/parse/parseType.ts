/**
 * Type Parsing
 *
 * Parse Cairo type strings into structured form.
 */

import type { ParsedType } from '../types.js';

/**
 * Parse a Cairo type string into structured form
 */
export function parseType(typeStr: string): ParsedType {
  // Handle core:: prefix stripping for display
  const normalized = typeStr.replace(/^core::/, '');

  // Array types: core::array::Array<T> or Array<T>
  const arrayMatch = typeStr.match(
    /^(?:core::array::)?(?:Array|Span)<(.+)>$/
  );
  if (arrayMatch?.[1]) {
    const isSpan = typeStr.includes('Span');
    return {
      kind: isSpan ? 'span' : 'array',
      name: isSpan ? 'Span' : 'Array',
      inner: parseType(arrayMatch[1]),
    };
  }

  // Option type: core::option::Option<T>
  const optionMatch = typeStr.match(/^(?:core::option::)?Option<(.+)>$/);
  if (optionMatch?.[1]) {
    return {
      kind: 'option',
      name: 'Option',
      inner: parseType(optionMatch[1]),
    };
  }

  // Tuple types: (T1, T2, ...)
  if (typeStr.startsWith('(') && typeStr.endsWith(')')) {
    const inner = typeStr.slice(1, -1);
    const members = splitTupleTypes(inner).map(parseType);
    return {
      kind: 'tuple',
      name: 'tuple',
      members,
    };
  }

  // Type normalization map (aliases → canonical names)
  const typeAliases: Record<string, string> = {
    // felt252 aliases
    'felt': 'felt252',
    'core::felt': 'felt252',
    // shortstring is a felt252 containing ASCII text
    'shortstring': 'shortstring',
    'core::shortstring': 'shortstring',
    // EthAddress alias
    'EthAddress': 'core::starknet::eth_address::EthAddress',
  };

  // Check for type aliases first
  if (typeStr in typeAliases) {
    const canonicalType = typeAliases[typeStr]!;
    return {
      kind: 'primitive',
      name: canonicalType,
    };
  }

  // Primitive types
  const primitives = new Set([
    'felt252',
    'core::felt252',
    'shortstring',
    'core::shortstring',
    'core::integer::u8',
    'core::integer::u16',
    'core::integer::u32',
    'core::integer::u64',
    'core::integer::u128',
    'core::integer::u256',
    'core::integer::i8',
    'core::integer::i16',
    'core::integer::i32',
    'core::integer::i64',
    'core::integer::i128',
    'core::bool',
    'core::starknet::contract_address::ContractAddress',
    'core::starknet::class_hash::ClassHash',
    'core::starknet::eth_address::EthAddress',
    'core::byte_array::ByteArray',
    'u8',
    'u16',
    'u32',
    'u64',
    'u128',
    'u256',
    'i8',
    'i16',
    'i32',
    'i64',
    'i128',
    'bool',
    'ContractAddress',
    'ClassHash',
    'EthAddress',
    'ByteArray',
  ]);

  if (primitives.has(typeStr)) {
    return {
      kind: 'primitive',
      name: normalized,
    };
  }

  // Otherwise assume struct or enum (will be resolved by ABI lookup)
  return {
    kind: 'struct',
    name: getShortName(typeStr),
    path: typeStr,
  };
}

/**
 * Split tuple type members respecting nested generics
 */
function splitTupleTypes(inner: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of inner) {
    if (char === '<' || char === '(') depth++;
    else if (char === '>' || char === ')') depth--;

    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Get short name from full path
 */
export function getShortName(path: string): string {
  const parts = path.split('::');
  return parts[parts.length - 1] ?? path;
}
