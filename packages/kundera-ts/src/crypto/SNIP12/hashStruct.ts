/**
 * Hash struct for SNIP-12
 *
 * Computes: hash_array(type_hash, Enc[param1], Enc[param2], ...)
 */

import type { Felt252Type } from "../../primitives/index.js";
import { poseidonHashMany } from "../hash.js";
import { EncodeValue } from "./encodeValue.js";
import { Snip12InvalidMessageError } from "./errors.js";
import { hashType } from "./hashType.js";
import type { Message, TypeDefinitions } from "./types.js";

/**
 * Hash a struct according to SNIP-12
 *
 * hash = hash_array(type_hash, Enc[param1], Enc[param2], ...)
 *
 * @param typeName - The struct type name
 * @param data - The struct data
 * @param types - Type definitions
 * @returns The struct hash as Felt252
 */
export function hashStruct(
	typeName: string,
	data: Message,
	types: TypeDefinitions,
): Felt252Type {
	// Create encodeValue with circular reference to hashStruct
	const encodeValue = EncodeValue({
		hashArray: poseidonHashMany,
		hashStruct,
	});

	// Get type hash
	const typeHash = hashType(typeName, types);

	// Get type properties
	const typeProps = types[typeName];
	if (!typeProps) {
		throw new Snip12InvalidMessageError(`Type '${typeName}' not found`, {
			typeName,
			availableTypes: Object.keys(types),
		});
	}

	// Encode each field
	const elements: Felt252Type[] = [typeHash];

	for (const prop of typeProps) {
		const value = data[prop.name];
		if (value === undefined) {
			throw new Snip12InvalidMessageError(
				`Missing field '${prop.name}' in ${typeName}`,
				{ typeName, field: prop.name, data },
			);
		}

		const encoded = encodeValue(prop.type, value, types);
		if (Array.isArray(encoded)) {
			// u256 returns [low, high] - add both
			elements.push(...encoded);
		} else {
			elements.push(encoded);
		}
	}

	return poseidonHashMany(elements);
}
