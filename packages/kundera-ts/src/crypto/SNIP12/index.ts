/**
 * SNIP-12 - Typed Structured Data Hashing and Signing for Starknet
 *
 * Implementation of the SNIP-12 specification for off-chain message signing.
 *
 * @see https://github.com/starknet-io/SNIPs/blob/main/SNIPS/snip-12.md
 *
 * @example
 * ```typescript
 * import { SNIP12 } from '@kundera-sn/kundera-ts';
 *
 * const typedData = {
 *   domain: {
 *     name: 'MyDapp',
 *     version: '1',
 *     chainId: 'SN_MAIN',
 *   },
 *   types: {
 *     Transfer: [
 *       { name: 'recipient', type: 'ContractAddress' },
 *       { name: 'amount', type: 'u256' },
 *     ],
 *   },
 *   primaryType: 'Transfer',
 *   message: {
 *     recipient: '0x123...',
 *     amount: 1000000000000000000n,
 *   },
 * };
 *
 * const hash = SNIP12.hashTypedData(typedData, accountAddress);
 * ```
 */

// Types
export type {
	Domain,
	TypeProperty,
	TypeDefinitions,
	PrimitiveValue,
	MessageValue,
	Message,
	TypedData,
} from "./types.js";

// Errors
export {
	Snip12Error,
	Snip12TypeNotFoundError,
	Snip12InvalidMessageError,
	Snip12InvalidDomainError,
	Snip12EncodingError,
} from "./errors.js";

// Functions
export { encodeType } from "./encodeType.js";
export { hashType } from "./hashType.js";
export { hashStruct } from "./hashStruct.js";
export { hashDomain } from "./hashDomain.js";
export { hashTypedData } from "./hashTypedData.js";

// Namespace export for convenient usage
import { encodeType } from "./encodeType.js";
import { hashDomain } from "./hashDomain.js";
import { hashStruct } from "./hashStruct.js";
import { hashType } from "./hashType.js";
import { hashTypedData } from "./hashTypedData.js";

/**
 * SNIP-12 namespace with all functions
 */
export const SNIP12 = {
	encodeType,
	hashType,
	hashStruct,
	hashDomain,
	hashTypedData,
} as const;
