/**
 * ABI Parsing
 *
 * Parse and index Starknet ABIs for efficient lookup.
 */

import {
	type AbiConstructorEntry,
	type AbiEventEntry,
	type AbiFunctionEntry,
	type AbiLike,
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
import { computeSelector } from "./computeSelector.js";
import { getShortName } from "./parseType.js";

/**
 * Parse and index an ABI for efficient lookup
 */
export function parseAbi(abi: AbiLike): Result<ParsedAbi> {
	try {
		const functions = new Map<string, IndexedFunction>();
		const functionsBySelector = new Map<string, IndexedFunction>();
		const events = new Map<string, IndexedEvent>();
		const eventsBySelector = new Map<string, IndexedEvent>();
		const structs = new Map<string, IndexedStruct>();
		const enums = new Map<string, IndexedEnum>();
		let constructorEntry: AbiConstructorEntry | undefined;

		// Count overloads for deterministic naming
		const functionCounts = new Map<string, number>();
		const eventCounts = new Map<string, number>();

		// First pass: collect all entries and count overloads
		for (const entry of abi) {
			if (entry.type === "function" || entry.type === "l1_handler") {
				const count = functionCounts.get(entry.name) ?? 0;
				functionCounts.set(entry.name, count + 1);
			} else if (entry.type === "event") {
				const count = eventCounts.get(entry.name) ?? 0;
				eventCounts.set(entry.name, count + 1);
			} else if (entry.type === "interface") {
				// Recursively process interface items
				for (const item of entry.items) {
					if (item.type === "function") {
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
				case "function":
				case "l1_handler": {
					indexFunction(
						entry as AbiFunctionEntry,
						functions,
						functionsBySelector,
						functionCounts,
						functionIndices,
					);
					break;
				}

				case "event": {
					indexEvent(
						entry,
						events,
						eventsBySelector,
						eventCounts,
						eventIndices,
					);
					break;
				}

				case "struct": {
					const shortName = getShortName(entry.name);
					structs.set(entry.name, { entry });
					structs.set(shortName, { entry });
					break;
				}

				case "enum": {
					const shortName = getShortName(entry.name);
					enums.set(entry.name, { entry });
					enums.set(shortName, { entry });
					break;
				}

				case "constructor": {
					constructorEntry = entry;
					break;
				}

				case "interface": {
					// Index functions from interface
					for (const item of entry.items) {
						if (item.type === "function") {
							indexFunction(
								item,
								functions,
								functionsBySelector,
								functionCounts,
								functionIndices,
							);
						}
					}
					break;
				}

				case "impl": {
					// Impls are metadata, skip
					break;
				}
			}
		}

		const parsed: ParsedAbi = {
			raw: abi,
			functions,
			functionsBySelector,
			events,
			eventsBySelector,
			structs,
			enums,
			...(constructorEntry ? { constructor: constructorEntry } : {}),
		};
		return ok(parsed);
	} catch (error) {
		return err(
			abiError(
				"INVALID_ABI",
				`Failed to parse ABI: ${error instanceof Error ? error.message : String(error)}`,
			),
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
	indices: Map<string, number>,
): void {
	const selector = computeSelector(entry.name);
	const selectorHex = `0x${selector.toString(16)}`;

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
	indices: Map<string, number>,
): void {
	const selector = computeSelector(entry.name);
	const selectorHex = `0x${selector.toString(16)}`;

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
