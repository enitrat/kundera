import { withFeltPrototype } from './internal.js';
import { fromHex } from './fromHex.js';
import { fromBigInt } from './fromBigInt.js';
import type { Felt252Type, Felt252Input } from './types.js';

export function from(value: Felt252Input): Felt252Type {
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
