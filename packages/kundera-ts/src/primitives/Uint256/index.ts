// Types
export type { Uint256Type } from './types.js';

// Constants
export { MIN, MAX, SIZE, LOW_MASK } from './constants.js';

// Errors
export { Uint256NegativeError, Uint256OverflowError, Uint256NotIntegerError } from './errors.js';

// Functions
import { from as _from } from './from.js';
import { toHex as _toHex } from './toHex.js';
import { toBigInt as _toBigInt } from './toBigInt.js';
import { toFelts as _toFelts } from './toFelts.js';
import { fromFelts as _fromFelts } from './fromFelts.js';
import { MIN, MAX, SIZE, LOW_MASK } from './constants.js';

export const from = _from;
export const toHex = _toHex;
export const toBigInt = _toBigInt;
export const toFelts = _toFelts;
export const fromFelts = _fromFelts;

/**
 * Uint256 namespace with all functions
 *
 * IMPORTANT: Unlike other integer types, Uint256 uses `toFelts()` (plural)
 * because Cairo serializes u256 as TWO felt252 values: [low, high]
 */
export const Uint256 = {
  from: _from,
  toHex: _toHex,
  toBigInt: _toBigInt,
  toFelts: _toFelts,
  fromFelts: _fromFelts,
  MIN,
  MAX,
  SIZE,
  LOW_MASK,
} as const;
