/**
 * SNIP-12 Type Definitions
 *
 * Types for typed structured data hashing and signing on Starknet.
 * @see https://github.com/starknet-io/SNIPs/blob/main/SNIPS/snip-12.md
 */

import type { ClassHashType } from "../../primitives/ClassHash/types.js";
import type { ContractAddressType } from "../../primitives/ContractAddress/types.js";
import type { Felt252Type } from "../../primitives/Felt252/types.js";
import type { Int8Type } from "../../primitives/Int8/types.js";
import type { Int16Type } from "../../primitives/Int16/types.js";
import type { Int32Type } from "../../primitives/Int32/types.js";
import type { Int64Type } from "../../primitives/Int64/types.js";
import type { Int128Type } from "../../primitives/Int128/types.js";
import type { Uint8Type } from "../../primitives/Uint8/types.js";
import type { Uint16Type } from "../../primitives/Uint16/types.js";
import type { Uint32Type } from "../../primitives/Uint32/types.js";
import type { Uint64Type } from "../../primitives/Uint64/types.js";
import type { Uint128Type } from "../../primitives/Uint128/types.js";
import type { Uint256Type } from "../../primitives/Uint256/types.js";

/**
 * SNIP-12 Domain separator fields
 *
 * The domain is used to prevent signature replay across different applications.
 */
export type Domain = {
	/** Application name */
	name?: string;
	/** Application version */
	version?: string;
	/** Chain ID (short string, e.g., "SN_MAIN", "SN_SEPOLIA") */
	chainId?: string;
	/** SNIP-12 revision (e.g., "1") */
	revision?: string;
};

/**
 * Type property definition
 */
export type TypeProperty = {
	name: string;
	type: string;
};

/**
 * Type definitions mapping type names to their properties
 */
export type TypeDefinitions = {
	[typeName: string]: readonly TypeProperty[];
};

/**
 * Primitive value types supported by SNIP-12
 */
export type PrimitiveValue =
	| Felt252Type
	| ContractAddressType
	| ClassHashType
	| Uint8Type
	| Uint16Type
	| Uint32Type
	| Uint64Type
	| Uint128Type
	| Uint256Type
	| Int8Type
	| Int16Type
	| Int32Type
	| Int64Type
	| Int128Type
	| string
	| bigint
	| number
	| boolean;

/**
 * Message value (can be primitive, array, or nested object)
 */
export type MessageValue =
	| PrimitiveValue
	| MessageValue[]
	| { [key: string]: MessageValue };

/**
 * Message data (object with arbitrary structure matching types)
 */
export type Message = {
	[key: string]: MessageValue;
};

/**
 * Complete SNIP-12 typed data structure
 */
export type TypedData = {
	/** Domain separator */
	domain: Domain;
	/** Type definitions */
	types: TypeDefinitions;
	/** The primary type being signed */
	primaryType: string;
	/** The message data */
	message: Message;
};
