/**
 * Encode type string for SNIP-12 hashing.
 *
 * Produces type encoding like "Mail(Person from,Person to,shortstring contents)Person(shortstring name,ContractAddress wallet)"
 *
 * @see https://github.com/starknet-io/SNIPs/blob/main/SNIPS/snip-12.md
 */

import { Snip12TypeNotFoundError } from './errors.js';
import type { TypeDefinitions } from './types.js';

/**
 * Basic types that don't need recursive encoding
 */
const BASIC_TYPES = new Set([
  'felt',
  'felt252',
  'bool',
  'selector',
  'timestamp',
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
  'ContractAddress',
  'ClassHash',
  'shortstring',
  'string',
  'ByteArray',
]);

/**
 * Check if a type is a basic type (not a custom struct)
 */
function isBasicType(type: string): boolean {
  // Handle array types
  if (type.endsWith('*')) {
    return isBasicType(type.slice(0, -1));
  }
  return BASIC_TYPES.has(type);
}

/**
 * Encode type string for SNIP-12 type hashing
 *
 * @param primaryType - Primary type name to encode
 * @param types - Type definitions mapping
 * @returns Encoded type string with primary type followed by referenced types in alphabetical order
 * @throws {Snip12TypeNotFoundError} If primaryType or any referenced type is not found
 *
 * @example
 * ```typescript
 * const types = {
 *   Mail: [{ name: 'from', type: 'Person' }, { name: 'contents', type: 'shortstring' }],
 *   Person: [{ name: 'name', type: 'shortstring' }]
 * };
 * const typeString = encodeType('Mail', types);
 * // Returns: "Mail(Person from,shortstring contents)Person(shortstring name)"
 * ```
 */
export function encodeType(primaryType: string, types: TypeDefinitions): string {
  const visited = new Set<string>();
  const result: string[] = [];

  function encodeTypeRecursive(typeName: string): void {
    if (visited.has(typeName)) return;

    const typeProps = types[typeName];
    if (!typeProps) {
      throw new Snip12TypeNotFoundError(typeName, Object.keys(types));
    }

    visited.add(typeName);

    // Add main type definition: TypeName(type1 name1,type2 name2)
    const fields = typeProps.map((p) => `${p.type} ${p.name}`).join(',');
    result.push(`${typeName}(${fields})`);

    // Collect referenced custom types (not basic types)
    const referencedTypes = typeProps
      .map((p) => {
        // Handle array types: Person* -> Person
        const baseType = p.type.endsWith('*') ? p.type.slice(0, -1) : p.type;
        return baseType;
      })
      .filter((t) => !isBasicType(t) && types[t] !== undefined)
      .sort();

    // Remove duplicates and recurse
    const uniqueRefs = [...new Set(referencedTypes)];
    for (const refType of uniqueRefs) {
      if (!visited.has(refType)) {
        encodeTypeRecursive(refType);
      }
    }
  }

  encodeTypeRecursive(primaryType);
  return result.join('');
}
