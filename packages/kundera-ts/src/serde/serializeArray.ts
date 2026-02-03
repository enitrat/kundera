import { type Felt252Type, Felt252 } from '../primitives/index.js';

/**
 * Serialize an array of felts (prepends length)
 */
export function serializeArray(felts: Felt252Type[]): Felt252Type[] {
  return [Felt252(felts.length), ...felts];
}
