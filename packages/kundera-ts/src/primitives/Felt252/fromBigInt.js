import { FIELD_PRIME } from './constants.js';
import { fromHex } from './fromHex.js';

/**
 * Create Felt252 from bigint
 * @param {bigint} value
 * @returns {import('./types.js').Felt252Type}
 */
export function fromBigInt(value) {
  if (value < 0n) {
    throw new Error('Felt252 cannot be negative');
  }
  if (value >= FIELD_PRIME) {
    throw new Error('Value exceeds field prime');
  }

  const hex = value.toString(16);
  return fromHex(hex);
}
