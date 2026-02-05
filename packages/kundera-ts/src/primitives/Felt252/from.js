import { withFeltPrototype } from './internal.js';
import { fromHex } from './fromHex.js';
import { fromBigInt } from './fromBigInt.js';

/**
 * Create Felt252 from various input types
 * @param {import('./types.js').Felt252Input} value
 * @returns {import('./types.js').Felt252Type}
 */
export function from(value) {
  if (typeof value === 'string') {
    return fromHex(value);
  }
  if (typeof value === 'bigint' || typeof value === 'number') {
    return fromBigInt(BigInt(value));
  }
  if (value instanceof Uint8Array) {
    if (value.length !== 32) {
      throw new Error('Felt252 must be exactly 32 bytes');
    }
    return withFeltPrototype(value);
  }
  return withFeltPrototype(value);
}
