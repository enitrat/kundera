import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type } from '../Felt252/types.js';
import { from } from './from.js';
import type { Uint256Type } from './types.js';

/**
 * Create Uint256 from two Felt252 values [low, high]
 *
 * In Cairo, u256 is a struct: { low: u128, high: u128 }
 * value = low + high * 2^128
 *
 * @param low - Low 128 bits as Felt252
 * @param high - High 128 bits as Felt252
 * @returns Uint256 value
 */
export function fromFelts(low: Felt252Type, high: Felt252Type): Uint256Type {
  const lowBigInt = Felt252.toBigInt(low);
  const highBigInt = Felt252.toBigInt(high);

  const value = lowBigInt + (highBigInt << 128n);
  return from(value);
}
