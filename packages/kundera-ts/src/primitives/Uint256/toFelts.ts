import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type } from '../Felt252/types.js';
import { LOW_MASK } from './constants.js';
import type { Uint256Type } from './types.js';

/**
 * Convert Uint256 to two Felt252 values [low, high]
 *
 * CRITICAL: In Cairo, u256 is a struct with two u128 fields:
 *   struct u256 { low: u128, high: u128 }
 *
 * Serialization format: [low, high]
 * value = low + high * 2^128
 *
 * @param uint - Uint256 value
 * @returns Tuple of [low, high] Felt252 values
 */
export function toFelts(uint: Uint256Type): [Felt252Type, Felt252Type] {
  const value = uint as bigint;
  const low = value & LOW_MASK;
  const high = value >> 128n;

  return [Felt252.fromBigInt(low), Felt252.fromBigInt(high)];
}
