// Types
export type { Uint8Type } from './types.js';

// Constants
export { MIN, MAX, SIZE } from './constants.js';

// Errors
export { Uint8NegativeError, Uint8OverflowError, Uint8NotIntegerError } from './errors.js';

// Internal functions (for advanced users)
export { from as _from } from './from.js';
export { toHex as _toHex } from './toHex.js';
export { toBigInt as _toBigInt } from './toBigInt.js';
export { toFelt as _toFelt } from './toFelt.js';

// Import for wrappers and namespace
import { from as _from } from './from.js';
import { toHex as _toHex } from './toHex.js';
import { toBigInt as _toBigInt } from './toBigInt.js';
import { toFelt as _toFelt } from './toFelt.js';
import { MIN, MAX, SIZE } from './constants.js';

// Public wrappers (accept multiple input types)
export const from = _from;
export const toHex = _toHex;
export const toBigInt = _toBigInt;
export const toFelt = _toFelt;

/**
 * Uint8 namespace with all functions
 */
export const Uint8 = {
  from: _from,
  toHex: _toHex,
  toBigInt: _toBigInt,
  toFelt: _toFelt,
  MIN,
  MAX,
  SIZE,
} as const;
