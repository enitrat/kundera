import { FIELD_PRIME } from './constants.js';
import { withFeltPrototype } from './internal.js';
import type { Felt252Type } from './types.js';

export function fromHex(hex: string): Felt252Type {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length > 64) {
    throw new Error('Hex string too long for Felt252');
  }
  let value: bigint;
  try {
    value = BigInt('0x' + (clean.length === 0 ? '0' : clean));
  } catch {
    throw new Error('Invalid hex string');
  }
  if (value >= FIELD_PRIME) {
    throw new Error('Value exceeds field prime');
  }

  const bytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }

  return withFeltPrototype(bytes);
}
