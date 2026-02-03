/**
 * Felt Arithmetic Functions
 */

import { Felt252, type Felt252Type } from '../primitives/index.js';
import { getNative, getWasm } from './state.js';

/**
 * Add two felts (a + b mod P)
 */
export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltAdd(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltAdd(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Subtract two felts (a - b mod P)
 */
export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltSub(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltSub(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Multiply two felts (a * b mod P)
 */
export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltMul(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltMul(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Divide two felts (a / b mod P)
 */
export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltDiv(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltDiv(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Negate a felt (-a mod P)
 */
export function feltNeg(a: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltNeg(a));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltNeg(a));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Multiplicative inverse (1/a mod P)
 */
export function feltInverse(a: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltInverse(a));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltInverse(a));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Power (base^exp mod P)
 */
export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltPow(base, exp));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltPow(base, exp));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Square root (returns sqrt if exists)
 */
export function feltSqrt(a: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltSqrt(a));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltSqrt(a));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}
