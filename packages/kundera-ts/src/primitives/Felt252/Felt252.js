import { FIELD_PRIME, MAX_SHORT_STRING_LENGTH } from "./constants.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromBigInt } from "./fromBigInt.js";
import { fromBytes } from "./fromBytes.js";
import {
	encodeShortString,
	encodeShortStringHex,
	decodeShortString,
} from "../ShortString/index.js";

const feltZero = from(0n);
const feltOne = from(1n);
const feltTwo = from(2n);

/**
 * Create a Felt252 from various input types
 * @type {import('./from.js').from & {
 *   from: typeof from,
 *   fromHex: typeof fromHex,
 *   fromBigInt: typeof fromBigInt,
 *   fromBytes: typeof fromBytes,
 *   isValid: (felt: import('./types.js').Felt252Type) => boolean,
 *   isZero: (felt: import('./types.js').Felt252Type) => boolean,
 *   equals: (a: import('./types.js').Felt252Type, b: import('./types.js').Felt252Type) => boolean,
 *   toHex: (felt: import('./types.js').Felt252Type) => string,
 *   toBigInt: (felt: import('./types.js').Felt252Type) => bigint,
 *   ZERO: import('./types.js').Felt252Type,
 *   ONE: import('./types.js').Felt252Type,
 *   TWO: import('./types.js').Felt252Type,
 *   PRIME: bigint,
 *   MAX_SHORT_STRING_LENGTH: number,
 *   encodeShortString: typeof encodeShortString,
 *   encodeShortStringHex: typeof encodeShortStringHex,
 *   decodeShortString: typeof decodeShortString
 * }}
 */
export const Felt252 = Object.assign(from, {
	from,
	fromHex,
	fromBigInt,
	fromBytes,
	/** @param {import('./types.js').Felt252Type} felt */
	isValid: (felt) => felt.isValid(),
	/** @param {import('./types.js').Felt252Type} felt */
	isZero: (felt) => felt.isZero(),
	/**
	 * @param {import('./types.js').Felt252Type} a
	 * @param {import('./types.js').Felt252Type} b
	 */
	equals: (a, b) => a.equals(b),
	/** @param {import('./types.js').Felt252Type} felt */
	toHex: (felt) => felt.toHex(),
	/** @param {import('./types.js').Felt252Type} felt */
	toBigInt: (felt) => felt.toBigInt(),
	ZERO: feltZero,
	ONE: feltOne,
	TWO: feltTwo,
	PRIME: FIELD_PRIME,
	MAX_SHORT_STRING_LENGTH,
	encodeShortString,
	encodeShortStringHex,
	decodeShortString,
});
