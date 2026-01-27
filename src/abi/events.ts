/**
 * Event Decoding
 *
 * Decode Starknet event logs using ABI definitions.
 */

import {
  type Abi,
  type CairoValue,
  type DecodedEvent,
  type DecodedStruct,
  type ParsedAbi,
  type ParsedType,
  type AbiEventMember,
  type Result,
  ok,
  err,
  abiError,
} from './types.js';
import { parseAbi, getEvent, parseType, computeSelector } from './parse.js';
import { encodeValue } from './encode.js';

// ============ ABI Caching ============

const abiCache = new WeakMap<Abi, ParsedAbi>();

/**
 * Get or create parsed ABI from cache
 */
function getParsedAbi(abi: Abi): Result<ParsedAbi> {
  const cached = abiCache.get(abi);
  if (cached) {
    return ok(cached);
  }

  const parsed = parseAbi(abi);
  if (parsed.error) {
    return parsed;
  }

  abiCache.set(abi, parsed.result);
  return parsed;
}

// ============ Event Raw Data ============

/**
 * Raw event data from RPC
 */
export interface EventData {
  /** Event keys (first key is usually the selector) */
  keys: (bigint | string)[];
  /** Event data */
  data: (bigint | string)[];
}

/**
 * Normalize event values to bigint
 */
function normalizeToBigInt(values: (bigint | string)[]): bigint[] {
  return values.map((v) => (typeof v === 'string' ? BigInt(v) : v));
}

// ============ Decode Context ============

interface DecodeContext {
  values: bigint[];
  offset: number;
}

function readNext(ctx: DecodeContext): bigint {
  if (ctx.offset >= ctx.values.length) {
    throw new Error(`Unexpected end of event data at offset ${ctx.offset}`);
  }
  const value = ctx.values[ctx.offset];
  if (value === undefined) {
    throw new Error(`Unexpected end of event data at offset ${ctx.offset}`);
  }
  ctx.offset++;
  return value;
}

// ============ Type Decoding ============

/**
 * Decode a value by type (simplified for events)
 */
function decodeByType(
  ctx: DecodeContext,
  type: ParsedType,
  abi: ParsedAbi
): CairoValue {
  switch (type.kind) {
    case 'primitive':
      return decodePrimitive(ctx, type.name);

    case 'array':
    case 'span':
      return decodeArray(ctx, type.inner!, abi);

    case 'tuple':
      return decodeTuple(ctx, type.members!, abi);

    case 'struct':
      return decodeStruct(ctx, type, abi);

    case 'option':
      return decodeOption(ctx, type.inner!, abi);

    case 'enum':
      return decodeEnum(ctx, type, abi);

    default:
      // Unknown type, try to read as single felt
      return readNext(ctx);
  }
}

function decodePrimitive(ctx: DecodeContext, typeName: string): CairoValue {
  if (
    typeName === 'u256' ||
    typeName === 'core::integer::u256' ||
    typeName === 'integer::u256'
  ) {
    const low = readNext(ctx);
    const high = readNext(ctx);
    return (high << 128n) | low;
  }

  if (typeName === 'bool' || typeName === 'core::bool') {
    return readNext(ctx) !== 0n;
  }

  return readNext(ctx);
}

function decodeArray(
  ctx: DecodeContext,
  elementType: ParsedType,
  abi: ParsedAbi
): CairoValue[] {
  const length = Number(readNext(ctx));
  const result: CairoValue[] = [];
  for (let i = 0; i < length; i++) {
    result.push(decodeByType(ctx, elementType, abi));
  }
  return result;
}

function decodeTuple(
  ctx: DecodeContext,
  memberTypes: ParsedType[],
  abi: ParsedAbi
): CairoValue[] {
  return memberTypes.map((t) => decodeByType(ctx, t, abi));
}

function decodeStruct(
  ctx: DecodeContext,
  type: ParsedType,
  abi: ParsedAbi
): DecodedStruct {
  const structDef = abi.structs.get(type.path ?? type.name);
  if (!structDef) {
    // If struct not found, just return a single value
    return { value: readNext(ctx) };
  }

  const result: DecodedStruct = {};
  for (const member of structDef.entry.members) {
    result[member.name] = decodeByType(ctx, parseType(member.type), abi);
  }
  return result;
}

function decodeOption(
  ctx: DecodeContext,
  innerType: ParsedType,
  abi: ParsedAbi
): CairoValue | null {
  const variant = readNext(ctx);
  if (variant === 1n) return null;
  return decodeByType(ctx, innerType, abi);
}

function decodeEnum(
  ctx: DecodeContext,
  type: ParsedType,
  abi: ParsedAbi
): CairoValue {
  const enumDef = abi.enums.get(type.path ?? type.name);
  if (!enumDef) {
    return { variant: 'unknown', value: readNext(ctx) };
  }

  const variantIndex = Number(readNext(ctx));
  const variant = enumDef.entry.variants[variantIndex];
  if (!variant) {
    return { variant: `variant_${variantIndex}`, value: null };
  }

  let value: CairoValue = null;
  if (variant.type !== '()' && variant.type !== 'unit') {
    value = decodeByType(ctx, parseType(variant.type), abi);
  }

  return { variant: variant.name, value };
}

// ============ Event Decoding ============

/**
 * Decode an event using the ABI
 *
 * @param abi - Contract ABI
 * @param eventNameOrSelector - Event name or selector (first key)
 * @param eventData - Raw event keys and data
 * @returns Decoded event with name and arguments, or error
 *
 * @example
 * ```ts
 * const result = decodeEvent(abi, 'Transfer', {
 *   keys: [selector, fromAddr, toAddr],
 *   data: [amountLow, amountHigh]
 * });
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   console.log(result.result.args);
 *   // { from: 0x123n, to: 0x456n, amount: 1000n }
 * }
 * ```
 */
export function decodeEvent(
  abi: Abi,
  eventNameOrSelector: string,
  eventData: EventData
): Result<DecodedEvent> {
  // Parse ABI
  const parsedResult = getParsedAbi(abi);
  if (parsedResult.error) {
    return parsedResult as Result<DecodedEvent>;
  }
  const parsed = parsedResult.result;

  // Get event definition
  const eventResult = getEvent(parsed, eventNameOrSelector);
  if (eventResult.error) {
    return eventResult as Result<DecodedEvent>;
  }
  const event = eventResult.result;

  // Normalize input values
  const keys = normalizeToBigInt(eventData.keys);
  const data = normalizeToBigInt(eventData.data);

  // Decode based on event kind
  try {
    if (event.entry.kind === 'struct' && event.entry.members) {
      const args = decodeStructEvent(keys, data, event.entry.members, parsed);
      return ok({
        name: event.entry.name,
        args,
      });
    } else {
      // Enum events are more complex, handle as flat data for now
      const args = decodeFlatEvent(keys, data);
      return ok({
        name: event.entry.name,
        args,
      });
    }
  } catch (error) {
    return err(
      abiError(
        'DECODE_ERROR',
        `Failed to decode event: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * Decode a struct-kind event
 */
function decodeStructEvent(
  keys: bigint[],
  data: bigint[],
  members: AbiEventMember[],
  abi: ParsedAbi
): DecodedStruct {
  const result: DecodedStruct = {};

  // Skip first key (selector)
  const keyCtx: DecodeContext = { values: keys.slice(1), offset: 0 };
  const dataCtx: DecodeContext = { values: data, offset: 0 };

  for (const member of members) {
    const type = parseType(member.type);

    if (member.kind === 'key') {
      // Keys are indexed values
      result[member.name] = decodeByType(keyCtx, type, abi);
    } else if (member.kind === 'data') {
      // Data is non-indexed values
      result[member.name] = decodeByType(dataCtx, type, abi);
    } else if (member.kind === 'nested' || member.kind === 'flat') {
      // Nested/flat events contain other event data
      // For simplicity, decode from data section
      result[member.name] = decodeByType(dataCtx, type, abi);
    }
  }

  return result;
}

/**
 * Decode event as flat values (fallback)
 */
function decodeFlatEvent(keys: bigint[], data: bigint[]): DecodedStruct {
  const result: DecodedStruct = {};

  // Skip selector (first key)
  keys.slice(1).forEach((key, i) => {
    result[`key_${i}`] = key;
  });

  data.forEach((d, i) => {
    result[`data_${i}`] = d;
  });

  return result;
}

/**
 * Decode event by selector (auto-detect from first key)
 *
 * @param abi - Contract ABI
 * @param eventData - Raw event with keys[0] as selector
 * @returns Decoded event or error
 */
export function decodeEventBySelector(
  abi: Abi,
  eventData: EventData
): Result<DecodedEvent> {
  if (eventData.keys.length === 0) {
    return err(abiError('DECODE_ERROR', 'Event has no keys (missing selector)'));
  }

  const selector = eventData.keys[0]!;
  const selectorHex =
    typeof selector === 'string'
      ? selector.toLowerCase()
      : '0x' + selector.toString(16);

  return decodeEvent(abi, selectorHex, eventData);
}

/**
 * Get event selector
 *
 * @param eventName - Event name
 * @returns Selector as bigint
 */
export function getEventSelector(eventName: string): bigint {
  return computeSelector(eventName);
}

/**
 * Get event selector as hex string
 *
 * @param eventName - Event name
 * @returns Selector as hex string (0x...)
 */
export function getEventSelectorHex(eventName: string): string {
  return '0x' + computeSelector(eventName).toString(16);
}

// ============ Receipt Event Types ============

/**
 * Raw event from transaction receipt
 */
export interface ReceiptEvent {
  /** Contract address that emitted the event */
  from_address: string;
  /** Event keys (first key is usually the selector) */
  keys: string[];
  /** Event data */
  data: string[];
}

/**
 * Transaction receipt with events
 */
export interface TransactionReceipt {
  /** Events emitted by the transaction */
  events?: ReceiptEvent[];
  /** Some receipts use different field names */
  [key: string]: unknown;
}

/**
 * Decoded event with metadata
 */
export interface DecodedReceiptEvent extends DecodedEvent {
  /** Contract address that emitted the event */
  fromAddress: string;
  /** Original event index in receipt */
  index: number;
}

/**
 * Options for filtering events
 */
export interface DecodeEventsOptions {
  /** Filter events by contract address */
  contractAddress?: string;
  /** Filter events by selector (event name or hex) - DEPRECATED: use `event` instead */
  selector?: string;
  /**
   * Filter by event name (computes selector automatically)
   * Takes precedence over `selector` if both are provided.
   */
  event?: string;
  /**
   * Filter by indexed args (key values).
   * Values can be single or array (OR semantics per position).
   * Multi-felt types (u256) support only single values (no OR arrays).
   * Undefined/missing = wildcard.
   */
  args?: Record<string, CairoValue | CairoValue[]>;
  /**
   * Filter by contract address (alias for contractAddress)
   */
  address?: string;
  /**
   * Raw keys filter (advanced escape hatch).
   * If provided, overrides `event` and `args`.
   * Format: keys[position][orIndex] - outer array is key position, inner is OR values.
   */
  rawKeys?: (bigint | string)[][];
}

/**
 * Result of compiling event filter to keys
 */
export interface CompiledEventFilter {
  /** Selector (keys[0]) */
  selector?: bigint;
  /** Keys for indexed args (keys[1..]) - each position can have multiple OR values */
  argKeys: bigint[][];
}

// ============ Event Filter Compilation ============

/**
 * Check if a type encodes to multiple felts (e.g., u256)
 */
function isMultiFeltType(typeStr: string): boolean {
  const normalized = typeStr.toLowerCase();
  return (
    normalized === 'u256' ||
    normalized === 'core::integer::u256' ||
    normalized === 'integer::u256'
  );
}

/**
 * Compile event filter options to keys for matching.
 *
 * @param abi - Contract ABI
 * @param eventName - Event name to filter by
 * @param args - Indexed args to filter by
 * @returns Compiled filter with selector and arg keys, or error
 */
export function compileEventFilter(
  abi: Abi,
  eventName: string,
  args?: Record<string, CairoValue | CairoValue[]>
): Result<CompiledEventFilter> {
  // Parse ABI
  const parsedResult = getParsedAbi(abi);
  if (parsedResult.error) {
    return parsedResult as Result<CompiledEventFilter>;
  }
  const parsed = parsedResult.result;

  // Get event definition
  const eventResult = getEvent(parsed, eventName);
  if (eventResult.error) {
    return eventResult as Result<CompiledEventFilter>;
  }
  const event = eventResult.result;

  // Compute selector
  const selector = computeSelector(eventName);

  // If no args filter, return just the selector
  if (!args || Object.keys(args).length === 0) {
    return ok({ selector, argKeys: [] });
  }

  // Get indexed (key) members from event
  if (event.entry.kind !== 'struct' || !event.entry.members) {
    return err(
      abiError('ENCODE_ERROR', `Event ${eventName} has no indexed members`)
    );
  }

  const keyMembers = event.entry.members.filter((m) => m.kind === 'key');
  const argKeys: bigint[][] = [];

  // Process each key member in order
  for (const member of keyMembers) {
    const argValue = args[member.name];

    // Undefined/missing = wildcard (empty array)
    if (argValue === undefined) {
      argKeys.push([]);
      continue;
    }

    const isMultiFelt = isMultiFeltType(member.type);
    const isArray = Array.isArray(argValue) && !isEnumValue(argValue);

    // Multi-felt types don't support OR arrays
    if (isMultiFelt && isArray) {
      return err(
        abiError(
          'ENCODE_ERROR',
          `OR arrays not supported for multi-felt type ${member.type} (arg: ${member.name}). Use a single value.`
        )
      );
    }

    // Encode the value(s)
    if (isArray) {
      // OR semantics: encode each value
      const orValues: bigint[] = [];
      for (const v of argValue as CairoValue[]) {
        const encoded = encodeValue(v, member.type, parsed);
        if (encoded.error) {
          return err(
            abiError(
              'ENCODE_ERROR',
              `Failed to encode arg ${member.name}: ${encoded.error.message}`
            )
          );
        }
        // Single-felt type should produce exactly one felt
        if (encoded.result.length !== 1) {
          return err(
            abiError(
              'ENCODE_ERROR',
              `Expected single felt for ${member.type}, got ${encoded.result.length}`
            )
          );
        }
        orValues.push(encoded.result[0]!);
      }
      argKeys.push(orValues);
    } else {
      // Single value
      const encoded = encodeValue(argValue as CairoValue, member.type, parsed);
      if (encoded.error) {
        return err(
          abiError(
            'ENCODE_ERROR',
            `Failed to encode arg ${member.name}: ${encoded.error.message}`
          )
        );
      }

      if (isMultiFelt) {
        // Multi-felt: push each felt as a separate key position (exact match)
        for (const felt of encoded.result) {
          argKeys.push([felt]);
        }
      } else {
        // Single-felt: push as single OR value
        argKeys.push(encoded.result);
      }
    }
  }

  return ok({ selector, argKeys });
}

/**
 * Check if value is a CairoEnumValue (not a plain array)
 */
function isEnumValue(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'variant' in value &&
    'value' in value
  );
}

/**
 * Match event keys against compiled filter
 */
function matchesFilter(
  eventKeys: bigint[],
  filter: CompiledEventFilter,
  addressFilter?: string,
  eventAddress?: string
): boolean {
  // Check address filter
  if (addressFilter && eventAddress) {
    if (eventAddress.toLowerCase() !== addressFilter.toLowerCase()) {
      return false;
    }
  }

  // Check selector (keys[0])
  if (filter.selector !== undefined) {
    if (eventKeys.length === 0 || eventKeys[0] !== filter.selector) {
      return false;
    }
  }

  // Check arg keys (keys[1..])
  for (let i = 0; i < filter.argKeys.length; i++) {
    const filterValues = filter.argKeys[i] ?? [];

    // Empty array = wildcard (match any)
    if (filterValues.length === 0) {
      continue;
    }

    // Get corresponding event key (offset by 1 for selector)
    const keyIndex = i + 1;
    if (keyIndex >= eventKeys.length) {
      return false; // Event doesn't have enough keys
    }

    const eventKeyValue = eventKeys[keyIndex];

    // OR semantics: match if any filter value matches
    if (!filterValues.some((fv) => fv === eventKeyValue)) {
      return false;
    }
  }

  return true;
}

// ============ Batch Event Decoding ============

/**
 * Decode all events from a transaction receipt
 *
 * This function decodes events from a transaction receipt using the provided ABI.
 * Events that don't match the ABI are skipped (no error, just not included in results).
 *
 * @param receipt - Transaction receipt containing events
 * @param abi - Contract ABI for decoding
 * @param options - Optional filtering by contract address, event name, or indexed args
 * @returns Array of decoded events with metadata, or error
 *
 * @example
 * ```ts
 * // Decode all events
 * const result = decodeEvents(receipt, abi);
 *
 * // Decode events from specific contract
 * const result = decodeEvents(receipt, abi, {
 *   contractAddress: '0x123...'
 * });
 *
 * // Decode only Transfer events (typed API)
 * const result = decodeEvents(receipt, abi, {
 *   event: 'Transfer'
 * });
 *
 * // Filter by event name AND indexed args (EVM topics-like semantics)
 * const result = decodeEvents(receipt, abi, {
 *   event: 'Transfer',
 *   args: { from: [addr1, addr2], to: addr3 }, // OR on 'from', exact on 'to'
 *   address: contractAddress
 * });
 *
 * // Low-level escape hatch (rawKeys overrides event/args)
 * const result = decodeEvents(receipt, abi, {
 *   rawKeys: [[selector], [from1, from2], [to]]
 * });
 *
 * if (result.error) {
 *   console.error(result.error.message);
 * } else {
 *   for (const event of result.result) {
 *     console.log(`${event.name} from ${event.fromAddress}:`, event.args);
 *   }
 * }
 * ```
 */
export function decodeEvents(
  receipt: TransactionReceipt,
  abi: Abi,
  options?: DecodeEventsOptions | string
): Result<DecodedReceiptEvent[]> {
  // Handle shorthand: if options is a string, treat as contractAddress
  const opts: DecodeEventsOptions =
    typeof options === 'string' ? { contractAddress: options } : options ?? {};

  // Parse ABI once for all events
  const parsedResult = getParsedAbi(abi);
  if (parsedResult.error) {
    return parsedResult as Result<DecodedReceiptEvent[]>;
  }

  // Get events array from receipt
  const events = receipt.events ?? [];
  if (events.length === 0) {
    return ok([]);
  }

  // Normalize address filter (support both 'address' and 'contractAddress')
  const addressFilter = (opts.address ?? opts.contractAddress)?.toLowerCase();

  // Build the filter
  let filter: CompiledEventFilter;

  if (opts.rawKeys && opts.rawKeys.length > 0) {
    // Raw keys escape hatch - convert to compiled filter format
    const first = opts.rawKeys[0]?.[0];
    const selector = first !== undefined ? BigInt(first) : undefined;
    const argKeys = opts.rawKeys.slice(1).map((pos) =>
      pos.map((v) => BigInt(v))
    );
    filter = { argKeys };
    if (selector !== undefined) {
      filter.selector = selector;
    }
  } else if (opts.event) {
    // Typed event + args filter
    const filterResult = compileEventFilter(abi, opts.event, opts.args);
    if (filterResult.error) {
      return filterResult as Result<DecodedReceiptEvent[]>;
    }
    filter = filterResult.result;
  } else if (opts.selector) {
    // Legacy selector filter (backward compat)
    const selector = opts.selector.startsWith('0x')
      ? BigInt(opts.selector)
      : computeSelector(opts.selector);
    filter = { argKeys: [] };
    filter.selector = selector;
  } else {
    // No filter - match all
    filter = { argKeys: [] };
  }

  const decoded: DecodedReceiptEvent[] = [];

  for (let index = 0; index < events.length; index++) {
    const event = events[index]!;

    // Skip events with no keys (can't decode without selector)
    if (!event.keys || event.keys.length === 0) {
      continue;
    }

    // Convert event keys to bigint for matching
    const eventKeys = normalizeToBigInt(event.keys);

    // Apply filter
    if (!matchesFilter(eventKeys, filter, addressFilter, event.from_address)) {
      continue;
    }

    // Try to decode the event
    const eventData: EventData = {
      keys: event.keys,
      data: event.data || [],
    };

    const decodeResult = decodeEventBySelector(abi, eventData);

    // Skip events that don't match the ABI (not an error, just unknown event)
    if (decodeResult.error) {
      continue;
    }

    decoded.push({
      ...decodeResult.result,
      fromAddress: event.from_address,
      index,
    });
  }

  return ok(decoded);
}

/**
 * Decode events with strict mode (error on unknown events)
 *
 * Unlike `decodeEvents`, this function returns an error if any event
 * cannot be decoded. Use this when you expect all events to be decodable.
 *
 * @param receipt - Transaction receipt containing events
 * @param abi - Contract ABI for decoding
 * @param options - Optional filtering options (same as decodeEvents)
 * @returns Array of decoded events, or error if any event fails to decode
 */
export function decodeEventsStrict(
  receipt: TransactionReceipt,
  abi: Abi,
  options?: DecodeEventsOptions | string
): Result<DecodedReceiptEvent[]> {
  const opts: DecodeEventsOptions =
    typeof options === 'string' ? { contractAddress: options } : options ?? {};

  const parsedResult = getParsedAbi(abi);
  if (parsedResult.error) {
    return parsedResult as Result<DecodedReceiptEvent[]>;
  }

  const events = receipt.events ?? [];
  if (events.length === 0) {
    return ok([]);
  }

  // Normalize address filter (support both 'address' and 'contractAddress')
  const addressFilter = (opts.address ?? opts.contractAddress)?.toLowerCase();

  // Build the filter (same logic as decodeEvents)
  let filter: CompiledEventFilter;

  if (opts.rawKeys && opts.rawKeys.length > 0) {
    const first = opts.rawKeys[0]?.[0];
    const selector = first !== undefined ? BigInt(first) : undefined;
    const argKeys = opts.rawKeys.slice(1).map((pos) =>
      pos.map((v) => BigInt(v))
    );
    filter = { argKeys };
    if (selector !== undefined) {
      filter.selector = selector;
    }
  } else if (opts.event) {
    const filterResult = compileEventFilter(abi, opts.event, opts.args);
    if (filterResult.error) {
      return filterResult as Result<DecodedReceiptEvent[]>;
    }
    filter = filterResult.result;
  } else if (opts.selector) {
    const selector = opts.selector.startsWith('0x')
      ? BigInt(opts.selector)
      : computeSelector(opts.selector);
    filter = { argKeys: [] };
    filter.selector = selector;
  } else {
    filter = { argKeys: [] };
  }

  const decoded: DecodedReceiptEvent[] = [];

  for (let index = 0; index < events.length; index++) {
    const event = events[index]!;

    if (!event.keys || event.keys.length === 0) {
      continue;
    }

    // Convert event keys to bigint for matching
    const eventKeys = normalizeToBigInt(event.keys);

    // Apply filter
    if (!matchesFilter(eventKeys, filter, addressFilter, event.from_address)) {
      continue;
    }

    const eventData: EventData = {
      keys: event.keys,
      data: event.data || [],
    };

    const decodeResult = decodeEventBySelector(abi, eventData);

    // In strict mode, return error for unknown events
    if (decodeResult.error) {
      return err(
        abiError(
          'DECODE_ERROR',
          `Failed to decode event at index ${index}: ${decodeResult.error.message}`
        )
      );
    }

    decoded.push({
      ...decodeResult.result,
      fromAddress: event.from_address,
      index,
    });
  }

  return ok(decoded);
}
