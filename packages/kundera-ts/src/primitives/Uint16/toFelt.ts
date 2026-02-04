import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type } from '../Felt252/types.js';
import type { Uint16Type } from './types.js';

/**
 * Convert Uint16 to Felt252
 *
 * @param uint - Uint16 value
 * @returns Felt252 value
 */
export function toFelt(uint: Uint16Type): Felt252Type {
  return Felt252.fromBigInt(uint);
}
