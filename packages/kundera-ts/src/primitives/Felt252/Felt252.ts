import { FIELD_PRIME, MAX_SHORT_STRING_LENGTH } from './constants.js';
import { from } from './from.js';
import { fromHex } from './fromHex.js';
import { fromBigInt } from './fromBigInt.js';
import { fromBytes } from './fromBytes.js';
import type { Felt252Type } from './types.js';
import {
  encodeShortString,
  encodeShortStringHex,
  decodeShortString,
} from '../ShortString/index.js';

const feltZero = from(0n);
const feltOne = from(1n);
const feltTwo = from(2n);

/**
 * Create a Felt252 from various input types
 */
export const Felt252 = Object.assign(from, {
  from,
  fromHex,
  fromBigInt,
  fromBytes,
  isValid: (felt: Felt252Type) => felt.isValid(),
  isZero: (felt: Felt252Type) => felt.isZero(),
  equals: (a: Felt252Type, b: Felt252Type) => a.equals(b),
  toHex: (felt: Felt252Type) => felt.toHex(),
  toBigInt: (felt: Felt252Type) => felt.toBigInt(),
  ZERO: feltZero,
  ONE: feltOne,
  TWO: feltTwo,
  PRIME: FIELD_PRIME,
  MAX_SHORT_STRING_LENGTH,
  encodeShortString,
  encodeShortStringHex,
  decodeShortString,
});
