// Types
export type { Uint64Type } from "./types.js";

// Constants
export { MIN, MAX, SIZE } from "./constants.js";

// Errors
export {
	Uint64NegativeError,
	Uint64OverflowError,
	Uint64NotIntegerError,
} from "./errors.js";

// Internal functions (for advanced users)
export { from as _from } from "./from.js";
export { toHex as _toHex } from "./toHex.js";
export { toBigInt as _toBigInt } from "./toBigInt.js";
export { toFelt as _toFelt } from "./toFelt.js";

import { MAX, MIN, SIZE } from "./constants.js";
// Import for wrappers and namespace
import { from as _from } from "./from.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toFelt as _toFelt } from "./toFelt.js";
import { toHex as _toHex } from "./toHex.js";

// Public wrappers (accept multiple input types)
export const from = _from;
export const toHex = _toHex;
export const toBigInt = _toBigInt;
export const toFelt = _toFelt;

/**
 * Uint64 namespace with all functions
 */
export const Uint64 = {
	from: _from,
	toHex: _toHex,
	toBigInt: _toBigInt,
	toFelt: _toFelt,
	MIN,
	MAX,
	SIZE,
} as const;
