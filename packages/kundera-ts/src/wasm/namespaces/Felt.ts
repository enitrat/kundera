/**
 * Felt Namespace (WASM)
 *
 * Merged namespace combining Felt252 primitives with WASM arithmetic operations.
 * Preserves the call signature of Felt252 while adding arithmetic methods.
 */

import { Felt as FeltPrimitives } from '../../primitives/index.js';
import {
  feltAdd,
  feltSub,
  feltMul,
  feltDiv,
  feltNeg,
  feltInverse,
  feltPow,
  feltSqrt,
} from '../crypto.js';

// Merge primitive Felt namespace with crypto ops (preserve call signature)
const FeltBase = ((
  value: Parameters<typeof FeltPrimitives>[0],
) => FeltPrimitives(value)) as typeof FeltPrimitives;

export const Felt = Object.assign(FeltBase, FeltPrimitives, {
  add: feltAdd,
  sub: feltSub,
  mul: feltMul,
  div: feltDiv,
  neg: feltNeg,
  inverse: feltInverse,
  pow: feltPow,
  sqrt: feltSqrt,
}) as typeof FeltPrimitives & {
  add: typeof feltAdd;
  sub: typeof feltSub;
  mul: typeof feltMul;
  div: typeof feltDiv;
  neg: typeof feltNeg;
  inverse: typeof feltInverse;
  pow: typeof feltPow;
  sqrt: typeof feltSqrt;
};
