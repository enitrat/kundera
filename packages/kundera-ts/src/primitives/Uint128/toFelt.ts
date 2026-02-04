import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type } from '../Felt252/types.js';
import type { Uint128Type } from './types.js';

/**
 * Convert Uint128 to Felt252
 *
 * @param uint - Uint128 value
 * @returns Felt252 value
 */
export function toFelt(uint: Uint128Type): Felt252Type {
  return Felt252.fromBigInt(uint);
}
