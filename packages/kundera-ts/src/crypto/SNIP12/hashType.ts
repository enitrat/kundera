/**
 * Hash type for SNIP-12
 *
 * Computes: starknet_keccak(encode_type(typeName))
 */

import type { Felt252Type } from "../../primitives/index.js";
import { snKeccak } from "../hash.js";
import { encodeType } from "./encodeType.js";
import type { TypeDefinitions } from "./types.js";

/**
 * Compute type hash for a struct type
 *
 * type_hash = starknet_keccak(encode_type(typeName))
 *
 * @param typeName - The type name to hash
 * @param types - Type definitions
 * @returns The type hash as a Felt252
 */
export function hashType(
	typeName: string,
	types: TypeDefinitions,
): Felt252Type {
	const encoded = encodeType(typeName, types);
	return snKeccak(encoded);
}
