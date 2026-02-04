import { MAX, PRIME } from './constants.js';
import { Felt252, type Felt252Type } from '../Felt252/index.js';
import { from } from './from.js';
import type { Int64Type } from './types.js';

/**
 * Decode a Felt252 back to an Int64.
 *
 * CRITICAL: This reverses Cairo's field encoding.
 *
 * Cairo encodes negative values as PRIME + negative_value.
 * To decode:
 * - If value <= MAX, it's positive (or zero)
 * - If value > MAX, it's a negative number: actual = value - PRIME
 *
 * @param felt - The Felt252 to decode
 * @returns The signed Int64 value
 * @throws Int64RangeError if the decoded value is outside Int64 range
 */
export function fromFelt(felt: Felt252Type): Int64Type {
  const value = Felt252.toBigInt(felt);

  // If value is within positive Int64 range, return as-is
  if (value <= MAX) {
    return from(value);
  }

  // Value > MAX means it's a negative number encoded as PRIME + negative
  // Decode by subtracting PRIME
  return from(value - PRIME);
}
