import { withFeltPrototype } from './internal.js';
import type { Felt252Type } from './types.js';

export function fromBytes(bytes: Uint8Array): Felt252Type {
  if (bytes.length !== 32) {
    throw new Error('Felt252 must be exactly 32 bytes');
  }
  return withFeltPrototype(new Uint8Array(bytes));
}
