// Types
export type { Uint8Type } from './types.js';

// Constants
export { MIN, MAX, SIZE } from './constants.js';

// Errors
export { Uint8NegativeError, Uint8OverflowError, Uint8NotIntegerError } from './errors.js';

// Functions
import { from as _from } from './from.js';
import { toHex as _toHex } from './toHex.js';
import { toBigInt as _toBigInt } from './toBigInt.js';
import { toFelt as _toFelt } from './toFelt.js';
import { MIN, MAX, SIZE } from './constants.js';
import type { Uint8Type } from './types.js';

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
