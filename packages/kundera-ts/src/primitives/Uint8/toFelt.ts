import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type } from '../Felt252/types.js';
import type { Uint8Type } from './types.js';

/**
 * Convert Uint8 to Felt252
 *
 * @param uint - Uint8 value
 * @returns Felt252 value
 */
export function toFelt(uint: Uint8Type): Felt252Type {
  return Felt252.fromBigInt(uint);
}
