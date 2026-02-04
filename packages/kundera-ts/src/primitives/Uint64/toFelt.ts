import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type } from '../Felt252/types.js';
import type { Uint64Type } from './types.js';

/**
 * Convert Uint64 to Felt252
 *
 * @param uint - Uint64 value
 * @returns Felt252 value
 */
export function toFelt(uint: Uint64Type): Felt252Type {
  return Felt252.fromBigInt(uint);
}
