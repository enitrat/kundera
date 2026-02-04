import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type } from '../Felt252/types.js';
import type { Uint32Type } from './types.js';

/**
 * Convert Uint32 to Felt252
 *
 * @param uint - Uint32 value
 * @returns Felt252 value
 */
export function toFelt(uint: Uint32Type): Felt252Type {
  return Felt252.fromBigInt(uint);
}
