import { FIELD_PRIME } from './constants.js';
import type { Felt252Type, FeltMethods } from './types.js';

export function bytesToHex(bytes: Uint8Array): string {
  return (
    '0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function toBigIntInternal(bytes: Uint8Array): bigint {
  return BigInt(bytesToHex(bytes));
}

const feltPrototype = Object.create(Uint8Array.prototype) as FeltMethods;

Object.defineProperties(feltPrototype, {
  toHex: {
    value: function toHex(this: Uint8Array): string {
      return bytesToHex(this);
    },
  },
  toBigInt: {
    value: function toBigInt(this: Uint8Array): bigint {
      return toBigIntInternal(this);
    },
  },
  isValid: {
    value: function isValid(this: Uint8Array): boolean {
      return toBigIntInternal(this) < FIELD_PRIME;
    },
  },
  isZero: {
    value: function isZero(this: Uint8Array): boolean {
      for (const byte of this) {
        if (byte !== 0) return false;
      }
      return true;
    },
  },
  equals: {
    value: function equals(this: Uint8Array, other: Felt252Type): boolean {
      if (this.length !== other.length) return false;
      for (let i = 0; i < this.length; i++) {
        if (this[i] !== other[i]) return false;
      }
      return true;
    },
  },
});

export function withFeltPrototype(bytes: Uint8Array): Felt252Type {
  if (Object.getPrototypeOf(bytes) !== feltPrototype) {
    Object.setPrototypeOf(bytes, feltPrototype);
  }
  return bytes as Felt252Type;
}
