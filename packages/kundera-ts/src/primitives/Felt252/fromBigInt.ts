import { FIELD_PRIME } from './constants.js';
import { fromHex } from './fromHex.js';
import type { Felt252Type } from './types.js';

export function fromBigInt(value: bigint): Felt252Type {
  if (value < 0n) {
    throw new Error('Felt252 cannot be negative');
  }
  if (value >= FIELD_PRIME) {
    throw new Error('Value exceeds field prime');
  }

  const hex = value.toString(16);
  return fromHex(hex);
}
