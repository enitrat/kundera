/**
 * ABI Getters
 *
 * Functions to retrieve entries from a parsed ABI.
 */

import {
	type IndexedEnum,
	type IndexedEvent,
	type IndexedFunction,
	type IndexedStruct,
	type ParsedAbi,
	type Result,
	abiError,
	err,
	ok,
} from "../types.js";

/**
 * Get function by name or selector
 */
export function getFunction(
	abi: ParsedAbi,
	nameOrSelector: string,
): Result<IndexedFunction> {
	// Try by name first
	const byName = abi.functions.get(nameOrSelector);
	if (byName) {
		return ok(byName);
	}

	// Try by selector if it looks like one (starts with 0x or is numeric)
	if (nameOrSelector.startsWith("0x") || /^\d+$/.test(nameOrSelector)) {
		try {
			const selectorHex = nameOrSelector.startsWith("0x")
				? nameOrSelector.toLowerCase()
				: `0x${BigInt(nameOrSelector).toString(16)}`;

			const bySelector = abi.functionsBySelector.get(selectorHex);
			if (bySelector) {
				return ok(bySelector);
			}
		} catch {
			// Not a valid selector, fall through to error
		}
	}

	return err(
		abiError("FUNCTION_NOT_FOUND", `Function not found: ${nameOrSelector}`),
	);
}

/**
 * Get event by name or selector
 */
export function getEvent(
	abi: ParsedAbi,
	nameOrSelector: string,
): Result<IndexedEvent> {
	// Try by name first
	const byName = abi.events.get(nameOrSelector);
	if (byName) {
		return ok(byName);
	}

	// Try by selector if it looks like one (starts with 0x or is numeric)
	if (nameOrSelector.startsWith("0x") || /^\d+$/.test(nameOrSelector)) {
		try {
			const selectorHex = nameOrSelector.startsWith("0x")
				? nameOrSelector.toLowerCase()
				: `0x${BigInt(nameOrSelector).toString(16)}`;

			const bySelector = abi.eventsBySelector.get(selectorHex);
			if (bySelector) {
				return ok(bySelector);
			}
		} catch {
			// Not a valid selector, fall through to error
		}
	}

	return err(abiError("EVENT_NOT_FOUND", `Event not found: ${nameOrSelector}`));
}

/**
 * Get struct definition by name
 */
export function getStruct(
	abi: ParsedAbi,
	name: string,
): IndexedStruct | undefined {
	return abi.structs.get(name);
}

/**
 * Get enum definition by name
 */
export function getEnum(abi: ParsedAbi, name: string): IndexedEnum | undefined {
	return abi.enums.get(name);
}
