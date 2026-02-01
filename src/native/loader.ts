/**
 * Native FFI Loader
 *
 * Unified loader that detects runtime (Bun vs Node.js) and delegates
 * to the appropriate FFI backend. Provides a consistent API regardless
 * of the underlying runtime.
 */

import { createRequire } from 'node:module';
import type { Felt252Type } from '../primitives/index.js';
import { isBun, isNode, getRuntime } from './platform.js';

const require = createRequire(import.meta.url);

// Re-export platform utilities
export { getNativeLibPath as getNativeLibraryPath, getRuntime, getPlatform, getArch } from './platform.js';

// Result codes from FFI (must match Rust enum)
export enum StarkResult {
  Success = 0,
  InvalidInput = 1,
  InvalidSignature = 2,
  RecoveryFailed = 3,
  DivisionByZero = 4,
  NoInverse = 5,
  NoSquareRoot = 6,
}

// ============ Backend Types ============

export interface NativeSignature {
  r: Felt252Type;
  s: Felt252Type;
}

interface NativeBackend {
  isAvailable(): boolean;
  getLibraryPath(): string | null;
  feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type;
  feltSub(a: Felt252Type, b: Felt252Type): Felt252Type;
  feltMul(a: Felt252Type, b: Felt252Type): Felt252Type;
  feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type;
  feltNeg(a: Felt252Type): Felt252Type;
  feltInverse(a: Felt252Type): Felt252Type;
  feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type;
  feltSqrt(a: Felt252Type): Felt252Type;
  pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type;
  poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type;
  poseidonHashMany(inputs: Felt252Type[]): Felt252Type;
  keccak256(data: Uint8Array): Felt252Type;
  getPublicKey(privateKey: Felt252Type): Felt252Type;
  sign(privateKey: Felt252Type, messageHash: Felt252Type): NativeSignature;
  verify(publicKey: Felt252Type, messageHash: Felt252Type, r: Felt252Type, s: Felt252Type): boolean;
  recover(messageHash: Felt252Type, r: Felt252Type, s: Felt252Type, v: Felt252Type): Felt252Type;
}

// ============ Backend Loading ============

let backend: NativeBackend | null = null;
let backendChecked = false;

/**
 * Get the appropriate backend for the current runtime
 */
function getBackend(): NativeBackend | null {
  if (backendChecked) return backend;
  backendChecked = true;

  if (isBun()) {
    try {
      // Dynamic import to avoid loading bun:ffi in Node
      backend = require('./bun-ffi.js') as NativeBackend;
      if (!backend.isAvailable()) {
        backend = null;
      }
    } catch {
      backend = null;
    }
  } else if (isNode()) {
    try {
      // Dynamic import to avoid loading ffi-napi in Bun
      backend = require('./node-ffi.js') as NativeBackend;
      if (!backend.isAvailable()) {
        backend = null;
      }
    } catch {
      backend = null;
    }
  }

  return backend;
}

/**
 * Get backend or throw with helpful error
 */
function requireBackend(): NativeBackend {
  const b = getBackend();
  if (!b) {
    const runtime = getRuntime();
    if (runtime === 'bun') {
      throw new Error(
        'Native library not found. Build with: cargo build --release'
      );
    } else {
      throw new Error(
        'Native FFI not available. Install ffi-napi: npm install ffi-napi ref-napi\n' +
        'And build the native library: cargo build --release'
      );
    }
  }
  return b;
}

// ============ Public API ============

/**
 * Check if native FFI is available
 */
export function isNativeAvailable(): boolean {
  const b = getBackend();
  return b !== null && b.isAvailable();
}

// ============ Felt Arithmetic ============

export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  return requireBackend().feltAdd(a, b);
}

export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  return requireBackend().feltSub(a, b);
}

export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  return requireBackend().feltMul(a, b);
}

export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  return requireBackend().feltDiv(a, b);
}

export function feltNeg(a: Felt252Type): Felt252Type {
  return requireBackend().feltNeg(a);
}

export function feltInverse(a: Felt252Type): Felt252Type {
  return requireBackend().feltInverse(a);
}

export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  return requireBackend().feltPow(base, exp);
}

export function feltSqrt(a: Felt252Type): Felt252Type {
  return requireBackend().feltSqrt(a);
}

// ============ Hashing ============

export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  return requireBackend().pedersenHash(a, b);
}

export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  return requireBackend().poseidonHash(a, b);
}

export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  return requireBackend().poseidonHashMany(inputs);
}

export function keccak256(data: Uint8Array): Felt252Type {
  return requireBackend().keccak256(data);
}

// ============ ECDSA ============

export function getPublicKey(privateKey: Felt252Type): Felt252Type {
  return requireBackend().getPublicKey(privateKey);
}

export function sign(privateKey: Felt252Type, messageHash: Felt252Type): NativeSignature {
  return requireBackend().sign(privateKey, messageHash);
}

export function verify(
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type
): boolean {
  return requireBackend().verify(publicKey, messageHash, r, s);
}

export function recover(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Felt252Type {
  return requireBackend().recover(messageHash, r, s, v);
}
