import { PRIME } from './constants.js';
import { Felt252, type Felt252Type } from '../Felt252/index.js';
import type { Int64Type } from './types.js';

/**
 * Convert an Int64 to a Felt252 using Cairo field encoding.
 *
 * CRITICAL: Cairo signed integer encoding is NOT two's complement!
 *
 * Cairo uses prime field arithmetic:
 * - Positive values: stored directly (0 to MAX)
 * - Negative values: stored as PRIME + negative_value
 *
 * This is because in modular arithmetic over the field,
 * PRIME + x === x (mod PRIME), so PRIME - 1 represents -1.
 *
 * @param value - The Int64 to convert
 * @returns The Felt252 representation for Cairo
 */
export function toFelt(value: Int64Type): Felt252Type {
  const bigintValue = value as bigint;

  if (bigintValue >= 0n) {
    return Felt252.fromBigInt(bigintValue);
  }

  // Negative: encode as PRIME + value
  // e.g., -1 becomes PRIME - 1
  return Felt252.fromBigInt(PRIME + bigintValue);
}
