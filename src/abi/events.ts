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
