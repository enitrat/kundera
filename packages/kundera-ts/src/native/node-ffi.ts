/**
 * Node.js FFI Backend
 *
 * Native FFI implementation using ffi-napi and ref-napi.
 * Only imported when running in Node.js runtime.
 */

import { createRequire } from 'node:module';
import type { Felt252Type } from '../primitives/index.js';
import { getNativeLibPath } from './platform.js';

const require = createRequire(import.meta.url);

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

// Types for ffi-napi (loaded dynamically)
type FFI = typeof import('ffi-napi');
type Ref = typeof import('ref-napi');

// Lazily loaded FFI modules
let ffi: FFI | null = null;
let ref: Ref | null = null;
let ffiChecked = false;

// Loaded library instance
let lib: any = null;
let libraryPath: string | null = null;

/**
 * Try to load ffi-napi and ref-napi
 */
function loadFfiModules(): boolean {
  if (ffiChecked) return ffi !== null;
  ffiChecked = true;

  try {
    ffi = require('ffi-napi');
    ref = require('ref-napi');
    return true;
  } catch {
    ffi = null;
    ref = null;
    return false;
  }
}

/**
 * Check if native library is available
 */
export function isAvailable(): boolean {
  if (!loadFfiModules()) return false;
  if (lib !== null) return true;
  return getNativeLibPath() !== null;
}

/**
 * Get the path to the native library (if found)
 */
export function getLibraryPath(): string | null {
  return libraryPath ?? getNativeLibPath();
}

/**
 * Load the native library (lazy, called automatically)
 */
function loadLibrary(): any {
  if (lib !== null) return lib;

  if (!loadFfiModules() || !ffi || !ref) {
    throw new Error(
      'ffi-napi not available. Install with: npm install ffi-napi ref-napi'
    );
  }

  const path = getNativeLibPath();
  if (!path) {
    throw new Error(
      'Native library not found. Build with: cargo build --release'
    );
  }

  libraryPath = path;

  // Define the library interface
  lib = ffi.Library(path, {
    // Felt arithmetic
    felt_add: ['int32', ['pointer', 'pointer', 'pointer']],
    felt_sub: ['int32', ['pointer', 'pointer', 'pointer']],
    felt_mul: ['int32', ['pointer', 'pointer', 'pointer']],
    felt_div: ['int32', ['pointer', 'pointer', 'pointer']],
    felt_neg: ['int32', ['pointer', 'pointer']],
    felt_inverse: ['int32', ['pointer', 'pointer']],
    felt_pow: ['int32', ['pointer', 'pointer', 'pointer']],
    felt_sqrt: ['int32', ['pointer', 'pointer']],
    // Hashing
    starknet_pedersen_hash: ['int32', ['pointer', 'pointer', 'pointer']],
    starknet_poseidon_hash: ['int32', ['pointer', 'pointer', 'pointer']],
    starknet_poseidon_hash_many: ['int32', ['pointer', 'uint64', 'pointer']],
    keccak256: ['int32', ['pointer', 'uint64', 'pointer']],
    starknet_keccak256: ['int32', ['pointer', 'uint64', 'pointer']],
    // ECDSA
    starknet_get_public_key: ['int32', ['pointer', 'pointer']],
    starknet_sign: ['int32', ['pointer', 'pointer', 'pointer', 'pointer']],
    starknet_verify: ['int32', ['pointer', 'pointer', 'pointer', 'pointer']],
    starknet_recover: ['int32', ['pointer', 'pointer', 'pointer', 'pointer', 'pointer']],
  });

  return lib;
}

/**
 * Convert StarkResult to error
 */
function checkResult(result: number): void {
  switch (result) {
    case StarkResult.Success:
      return;
    case StarkResult.InvalidInput:
      throw new Error('Invalid input');
    case StarkResult.InvalidSignature:
      throw new Error('Invalid signature');
    case StarkResult.RecoveryFailed:
      throw new Error('Recovery failed');
    case StarkResult.DivisionByZero:
      throw new Error('Division by zero');
    case StarkResult.NoInverse:
      throw new Error('No multiplicative inverse');
    case StarkResult.NoSquareRoot:
      throw new Error('No square root exists');
    default:
      throw new Error(`Unknown error code: ${result}`);
  }
}

/**
 * Convert Uint8Array to Buffer for ffi-napi
 */
function toBuffer(arr: Uint8Array): Buffer {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
}

/**
 * Copy result from output buffer to new Felt252
 */
function copyResult(out: Buffer): Felt252Type {
  return new Uint8Array(out) as Felt252Type;
}

// ============ Exported Functions ============

export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.felt_add(toBuffer(a), toBuffer(b), out);
  checkResult(result);
  return copyResult(out);
}

export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.felt_sub(toBuffer(a), toBuffer(b), out);
  checkResult(result);
  return copyResult(out);
}

export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.felt_mul(toBuffer(a), toBuffer(b), out);
  checkResult(result);
  return copyResult(out);
}

export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.felt_div(toBuffer(a), toBuffer(b), out);
  checkResult(result);
  return copyResult(out);
}

export function feltNeg(a: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.felt_neg(toBuffer(a), out);
  checkResult(result);
  return copyResult(out);
}

export function feltInverse(a: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.felt_inverse(toBuffer(a), out);
  checkResult(result);
  return copyResult(out);
}

export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.felt_pow(toBuffer(base), toBuffer(exp), out);
  checkResult(result);
  return copyResult(out);
}

export function feltSqrt(a: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.felt_sqrt(toBuffer(a), out);
  checkResult(result);
  return copyResult(out);
}

export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.starknet_pedersen_hash(toBuffer(a), toBuffer(b), out);
  checkResult(result);
  return copyResult(out);
}

export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.starknet_poseidon_hash(toBuffer(a), toBuffer(b), out);
  checkResult(result);
  return copyResult(out);
}

export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  const lib = loadLibrary();
  // Pack inputs into contiguous buffer
  const packed = Buffer.alloc(inputs.length * 32);
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input) {
      throw new Error(`Invalid input at index ${i}`);
    }
    packed.set(input, i * 32);
  }
  const out = Buffer.alloc(32);
  const result = lib.starknet_poseidon_hash_many(packed, inputs.length, out);
  checkResult(result);
  return copyResult(out);
}

/**
 * Standard Keccak256 hash (full 32 bytes)
 */
export function keccak256(data: Uint8Array): Uint8Array {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const dataBuf = data.length > 0 ? Buffer.from(data) : Buffer.alloc(0);
  const result = lib.keccak256(dataBuf, data.length, out);
  checkResult(result);
  return new Uint8Array(out);
}

/**
 * Starknet Keccak256 (truncated to 250 bits, returns Felt252)
 */
export function snKeccak256(data: Uint8Array): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const dataBuf = data.length > 0 ? Buffer.from(data) : Buffer.alloc(0);
  const result = lib.starknet_keccak256(dataBuf, data.length, out);
  checkResult(result);
  return copyResult(out);
}

export function getPublicKey(privateKey: Felt252Type): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.starknet_get_public_key(toBuffer(privateKey), out);
  checkResult(result);
  return copyResult(out);
}

export interface NativeSignature {
  r: Felt252Type;
  s: Felt252Type;
}

export function sign(
  privateKey: Felt252Type,
  messageHash: Felt252Type
): NativeSignature {
  const lib = loadLibrary();
  const outR = Buffer.alloc(32);
  const outS = Buffer.alloc(32);
  const result = lib.starknet_sign(
    toBuffer(privateKey),
    toBuffer(messageHash),
    outR,
    outS
  );
  checkResult(result);
  return {
    r: copyResult(outR),
    s: copyResult(outS),
  };
}

export function verify(
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type
): boolean {
  const lib = loadLibrary();
  const result = lib.starknet_verify(
    toBuffer(publicKey),
    toBuffer(messageHash),
    toBuffer(r),
    toBuffer(s)
  );
  if (result === StarkResult.Success) return true;
  if (result === StarkResult.InvalidSignature) return false;
  checkResult(result);
  return false;
}

export function recover(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Felt252Type {
  const lib = loadLibrary();
  const out = Buffer.alloc(32);
  const result = lib.starknet_recover(
    toBuffer(messageHash),
    toBuffer(r),
    toBuffer(s),
    toBuffer(v),
    out
  );
  checkResult(result);
  return copyResult(out);
}
