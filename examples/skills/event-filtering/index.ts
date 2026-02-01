/**
 * Event Filtering Skill
 *
 * Decode and filter receipt events using ABI metadata.
 * Copy into your project and tailor as needed.
 */

import {
  type Abi,
  type CairoValue,
  type DecodedEvent,
  type ParsedAbi,
  type Result,
  ok,
  err,
  abiError,
  parseAbi,
  getEvent,
  computeSelector,
  encodeValue,
  decodeEventBySelector,
} from 'kundera/abi';

// ============ ABI Caching ============

const abiCache = new WeakMap<Abi, ParsedAbi>();

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
 * Normalize event values to bigint
 */
function normalizeToBigInt(values: (bigint | string)[]): bigint[] {
  return values.map((v) => (typeof v === 'string' ? BigInt(v) : v));
}

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
  args?: Record<string, CairoValue | CairoValue[]>,
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
      abiError('ENCODE_ERROR', `Event ${eventName} has no indexed members`),
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
          `OR arrays not supported for multi-felt type ${member.type} (arg: ${member.name}). Use a single value.`,
        ),
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
              `Failed to encode arg ${member.name}: ${encoded.error.message}`,
            ),
          );
        }
        // Single-felt type should produce exactly one felt
        if (encoded.result.length !== 1) {
          return err(
            abiError(
              'ENCODE_ERROR',
              `Expected single felt for ${member.type}, got ${encoded.result.length}`,
            ),
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
            `Failed to encode arg ${member.name}: ${encoded.error.message}`,
          ),
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
  eventAddress?: string,
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
 */
export function decodeEvents(
  receipt: TransactionReceipt,
  abi: Abi,
  options?: DecodeEventsOptions | string,
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
      pos.map((v) => BigInt(v)),
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
    const decodeResult = decodeEventBySelector(abi, {
      keys: event.keys,
      data: event.data || [],
    });

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
 */
export function decodeEventsStrict(
  receipt: TransactionReceipt,
  abi: Abi,
  options?: DecodeEventsOptions | string,
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
      pos.map((v) => BigInt(v)),
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

    const decodeResult = decodeEventBySelector(abi, {
      keys: event.keys,
      data: event.data || [],
    });

    // In strict mode, return error for unknown events
    if (decodeResult.error) {
      return err(
        abiError(
          'DECODE_ERROR',
          `Failed to decode event at index ${index}: ${decodeResult.error.message}`,
        ),
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
