/**
 * Native Crypto Functions
 *
 * Thin wrappers around native FFI crypto operations.
 */

import type { Signature } from '../api-interface.js';
import { Felt252, type Felt252Type } from '../primitives/index.js';
import {
  isNativeAvailable,
  feltAdd as nativeFeltAdd,
  feltSub as nativeFeltSub,
  feltMul as nativeFeltMul,
  feltDiv as nativeFeltDiv,
  feltNeg as nativeFeltNeg,
  feltInverse as nativeFeltInverse,
  feltPow as nativeFeltPow,
  feltSqrt as nativeFeltSqrt,
  pedersenHash as nativePedersenHash,
  poseidonHash as nativePoseidonHash,
  poseidonHashMany as nativePoseidonHashMany,
  keccak256 as nativeKeccak256,
  getPublicKey as nativeGetPublicKey,
  sign as nativeSign,
  verify as nativeVerify,
  recover as nativeRecover,
} from './loader.js';

/**
 * Ensure native is available, throw helpful error if not
 */
function ensureNativeAvailable(): void {
  if (!isNativeAvailable()) {
    throw new Error(
      'Native FFI not available. Use Bun or Node.js with koffi, and build with: cargo build --release'
    );
  }
}

// ============ Availability ============

/**
 * WASM is never available in native entrypoint
 */
export function isWasmAvailable(): boolean {
  return false;
}

/**
 * WASM is never loaded in native entrypoint
 */
export function isWasmLoaded(): boolean {
  return false;
}

/**
 * No-op in native entrypoint (native doesn't need async loading)
 */
export async function loadWasmCrypto(): Promise<void> {
  // No-op - native doesn't need loading
}

// ============ Hashing ============

export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativePedersenHash(a, b));
}

export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativePoseidonHash(a, b));
}

export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativePoseidonHashMany(inputs));
}

export function snKeccak(data: Uint8Array | string): Felt252Type {
  ensureNativeAvailable();
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return Felt252(nativeKeccak256(bytes));
}

// ============ Felt Arithmetic ============

export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeFeltAdd(a, b));
}

export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeFeltSub(a, b));
}

export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeFeltMul(a, b));
}

export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeFeltDiv(a, b));
}

export function feltNeg(a: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeFeltNeg(a));
}

export function feltInverse(a: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeFeltInverse(a));
}

export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeFeltPow(base, exp));
}

export function feltSqrt(a: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeFeltSqrt(a));
}

// ============ ECDSA ============

export function sign(privateKey: Felt252Type, messageHash: Felt252Type): Signature {
  ensureNativeAvailable();
  const signature = nativeSign(privateKey, messageHash);
  return { r: Felt252(signature.r), s: Felt252(signature.s) };
}

export function verify(
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  signature: Signature
): boolean {
  ensureNativeAvailable();
  return nativeVerify(publicKey, messageHash, signature.r, signature.s);
}

export function getPublicKey(privateKey: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeGetPublicKey(privateKey));
}

export function recover(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Felt252Type {
  ensureNativeAvailable();
  return Felt252(nativeRecover(messageHash, r, s, v));
}
