/**
 * ABI Parsing
 *
 * Parse and index Starknet ABIs for efficient lookup.
 */

import { snKeccak } from '../crypto/index.js';
import { toBigInt, toHex } from '../primitives/index.js';
import {
  type Abi,
  type AbiEntry,
  type AbiFunctionEntry,
  type AbiEventEntry,
  type AbiStructEntry,
  type AbiEnumEntry,
  type AbiConstructorEntry,
  type ParsedAbi,
  type IndexedFunction,
  type IndexedEvent,
  type IndexedStruct,
  type IndexedEnum,
  type ParsedType,
  type Result,
  ok,
  err,
  abiError,
} from './types.js';

// ============ Selector Computation ============

/**
 * Compute function/event selector from name
 *
 * Selector = starknet_keccak(name) mod 2^250
 */
export function computeSelector(name: string): bigint {
  const hash = snKeccak(name);
  const value = toBigInt(hash);
  // Mask to 250 bits
  const mask = (1n << 250n) - 1n;
  return value & mask;
}

/**
 * Compute selector and return as hex
 */
export function computeSelectorHex(name: string): string {
  const selector = computeSelector(name);
  return '0x' + selector.toString(16);
}

// ============ Type Parsing ============

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
  if (arrayMatch) {
    const isSpan = typeStr.includes('Span');
    return {
      kind: isSpan ? 'span' : 'array',
      name: isSpan ? 'Span' : 'Array',
      inner: parseType(arrayMatch[1]),
    };
  }

  // Option type: core::option::Option<T>
  const optionMatch = typeStr.match(/^(?:core::option::)?Option<(.+)>$/);
  if (optionMatch) {
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
    const canonicalType = typeAliases[typeStr];
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
function getShortName(path: string): string {
  const parts = path.split('::');
  return parts[parts.length - 1];
}

// ============ ABI Parsing ============

/**
 * Parse and index an ABI for efficient lookup
 */
export function parseAbi(abi: Abi): Result<ParsedAbi> {
  try {
    const functions = new Map<string, IndexedFunction>();
    const functionsBySelector = new Map<string, IndexedFunction>();
    const events = new Map<string, IndexedEvent>();
    const eventsBySelector = new Map<string, IndexedEvent>();
    const structs = new Map<string, IndexedStruct>();
    const enums = new Map<string, IndexedEnum>();
    let constructor: AbiConstructorEntry | undefined;

    // Count overloads for deterministic naming
    const functionCounts = new Map<string, number>();
    const eventCounts = new Map<string, number>();

    // First pass: collect all entries and count overloads
    for (const entry of abi) {
      if (entry.type === 'function' || entry.type === 'l1_handler') {
        const count = functionCounts.get(entry.name) ?? 0;
        functionCounts.set(entry.name, count + 1);
      } else if (entry.type === 'event') {
        const count = eventCounts.get(entry.name) ?? 0;
        eventCounts.set(entry.name, count + 1);
      } else if (entry.type === 'interface') {
        // Recursively process interface items
        for (const item of entry.items) {
          if (item.type === 'function') {
            const count = functionCounts.get(item.name) ?? 0;
            functionCounts.set(item.name, count + 1);
          }
        }
      }
    }

    // Track current index for overloaded functions/events
    const functionIndices = new Map<string, number>();
    const eventIndices = new Map<string, number>();

    // Second pass: index all entries
    for (const entry of abi) {
      switch (entry.type) {
        case 'function':
        case 'l1_handler': {
          indexFunction(
            entry as AbiFunctionEntry,
            functions,
            functionsBySelector,
            functionCounts,
            functionIndices
          );
          break;
        }

        case 'event': {
          indexEvent(
            entry,
            events,
            eventsBySelector,
            eventCounts,
            eventIndices
          );
          break;
        }

        case 'struct': {
          const shortName = getShortName(entry.name);
          structs.set(entry.name, { entry });
          structs.set(shortName, { entry });
          break;
        }

        case 'enum': {
          const shortName = getShortName(entry.name);
          enums.set(entry.name, { entry });
          enums.set(shortName, { entry });
          break;
        }

        case 'constructor': {
          constructor = entry;
          break;
        }

        case 'interface': {
          // Index functions from interface
          for (const item of entry.items) {
            if (item.type === 'function') {
              indexFunction(
                item,
                functions,
                functionsBySelector,
                functionCounts,
                functionIndices
              );
            }
          }
          break;
        }

        case 'impl': {
          // Impls are metadata, skip
          break;
        }
      }
    }

    return ok({
      raw: abi,
      functions,
      functionsBySelector,
      events,
      eventsBySelector,
      structs,
      enums,
      constructor,
    });
  } catch (error) {
    return err(
      abiError(
        'INVALID_ABI',
        `Failed to parse ABI: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Index a function entry
 */
function indexFunction(
  entry: AbiFunctionEntry,
  functions: Map<string, IndexedFunction>,
  functionsBySelector: Map<string, IndexedFunction>,
  counts: Map<string, number>,
  indices: Map<string, number>
): void {
  const selector = computeSelector(entry.name);
  const selectorHex = '0x' + selector.toString(16);

  const indexed: IndexedFunction = {
    entry,
    selector,
    selectorHex,
  };

  // Index by name
  const count = counts.get(entry.name) ?? 1;
  if (count === 1) {
    // No overloads: use plain name
    functions.set(entry.name, indexed);
  } else {
    // Has overloads: use indexed name
    const idx = indices.get(entry.name) ?? 0;
    functions.set(`${entry.name}_${idx}`, indexed);
    indices.set(entry.name, idx + 1);

    // Also set plain name to first occurrence
    if (idx === 0) {
      functions.set(entry.name, indexed);
    }
  }

  // Index by selector
  functionsBySelector.set(selectorHex, indexed);
}

/**
 * Index an event entry
 */
function indexEvent(
  entry: AbiEventEntry,
  events: Map<string, IndexedEvent>,
  eventsBySelector: Map<string, IndexedEvent>,
  counts: Map<string, number>,
  indices: Map<string, number>
): void {
  const selector = computeSelector(entry.name);
  const selectorHex = '0x' + selector.toString(16);

  const indexed: IndexedEvent = {
    entry,
    selector,
    selectorHex,
  };

  // Index by name
  const count = counts.get(entry.name) ?? 1;
  if (count === 1) {
    events.set(entry.name, indexed);
  } else {
    const idx = indices.get(entry.name) ?? 0;
    events.set(`${entry.name}_${idx}`, indexed);
    indices.set(entry.name, idx + 1);

    if (idx === 0) {
      events.set(entry.name, indexed);
    }
  }

  // Also index by short name
  const shortName = getShortName(entry.name);
  if (shortName !== entry.name) {
    events.set(shortName, indexed);
  }

  // Index by selector
  eventsBySelector.set(selectorHex, indexed);
}

/**
 * Get function by name or selector
 */
export function getFunction(
  abi: ParsedAbi,
  nameOrSelector: string
): Result<IndexedFunction> {
  // Try by name first
  const byName = abi.functions.get(nameOrSelector);
  if (byName) {
    return ok(byName);
  }

  // Try by selector if it looks like one (starts with 0x or is numeric)
  if (nameOrSelector.startsWith('0x') || /^\d+$/.test(nameOrSelector)) {
    try {
      const selectorHex = nameOrSelector.startsWith('0x')
        ? nameOrSelector.toLowerCase()
        : '0x' + BigInt(nameOrSelector).toString(16);

      const bySelector = abi.functionsBySelector.get(selectorHex);
      if (bySelector) {
        return ok(bySelector);
      }
    } catch {
      // Not a valid selector, fall through to error
    }
  }

  return err(
    abiError('FUNCTION_NOT_FOUND', `Function not found: ${nameOrSelector}`)
  );
}

/**
 * Get event by name or selector
 */
export function getEvent(
  abi: ParsedAbi,
  nameOrSelector: string
): Result<IndexedEvent> {
  // Try by name first
  const byName = abi.events.get(nameOrSelector);
  if (byName) {
    return ok(byName);
  }

  // Try by selector if it looks like one (starts with 0x or is numeric)
  if (nameOrSelector.startsWith('0x') || /^\d+$/.test(nameOrSelector)) {
    try {
      const selectorHex = nameOrSelector.startsWith('0x')
        ? nameOrSelector.toLowerCase()
        : '0x' + BigInt(nameOrSelector).toString(16);

      const bySelector = abi.eventsBySelector.get(selectorHex);
      if (bySelector) {
        return ok(bySelector);
      }
    } catch {
      // Not a valid selector, fall through to error
    }
  }

  return err(
    abiError('EVENT_NOT_FOUND', `Event not found: ${nameOrSelector}`)
  );
}

/**
 * Get struct definition by name
 */
export function getStruct(
  abi: ParsedAbi,
  name: string
): IndexedStruct | undefined {
  return abi.structs.get(name);
}

/**
 * Get enum definition by name
 */
export function getEnum(abi: ParsedAbi, name: string): IndexedEnum | undefined {
  return abi.enums.get(name);
}
