import { MAX, PRIME } from './constants.js';
import { Felt252, type Felt252Type } from '../Felt252/index.js';
import { from } from './from.js';
import type { Int128Type } from './types.js';

/**
 * Decode a Felt252 back to an Int128.
 *
 * CRITICAL: This reverses Cairo's field encoding.
 *
 * Cairo encodes negative values as PRIME + negative_value.
 * To decode:
 * - If value <= MAX, it's positive (or zero)
 * - If value > MAX, it's a negative number: actual = value - PRIME
 *
 * @param felt - The Felt252 to decode
 * @returns The signed Int128 value
 * @throws Int128RangeError if the decoded value is outside Int128 range
 */
export function fromFelt(felt: Felt252Type): Int128Type {
  const value = Felt252.toBigInt(felt);

  // If value is within positive Int128 range, return as-is
  if (value <= MAX) {
    return from(value);
  }

  // Value > MAX means it's a negative number encoded as PRIME + negative
  // Decode by subtracting PRIME
  return from(value - PRIME);
}
