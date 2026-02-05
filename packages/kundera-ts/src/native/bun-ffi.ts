/**
 * Bun FFI Backend
 *
 * Native FFI implementation using Bun's built-in FFI.
 * Only imported when running in Bun runtime.
 */

import { dlopen, FFIType, ptr, type Pointer } from 'bun:ffi';
import type { Felt252Type } from '../primitives/index.js';
import { getNativeLibPath } from './platform.js';

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

// FFI symbols definition
const symbols = {
  // Felt arithmetic
  felt_add: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  felt_sub: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  felt_mul: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  felt_div: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  felt_neg: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  felt_inverse: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  felt_pow: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  felt_sqrt: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  // Hashing
  starknet_pedersen_hash: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  starknet_poseidon_hash: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  starknet_poseidon_hash_many: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
    returns: FFIType.i32,
  },
  keccak256: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
    returns: FFIType.i32,
  },
  starknet_keccak256: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
    returns: FFIType.i32,
  },
  // ECDSA
  starknet_get_public_key: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  starknet_sign: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  starknet_verify: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  starknet_recover: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
} as const;

// Loaded library instance
let lib: ReturnType<typeof dlopen<typeof symbols>> | null = null;
let libraryPath: string | null = null;

/**
 * Check if native library is available
 */
export function isAvailable(): boolean {
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
function loadLibrary(): typeof lib {
  if (lib !== null) return lib;

  const path = getNativeLibPath();
  if (!path) {
    throw new Error(
      'Native library not found. Build with: cargo build --release'
    );
  }

  libraryPath = path;
  lib = dlopen(path, symbols);
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
 * Create a pointer to a Uint8Array for FFI calls
 */
function feltPtr(felt: Felt252Type): Pointer {
  return ptr(felt);
}

/**
 * Copy result from output buffer to new Felt252
 */
function copyResult(out: Uint8Array): Felt252Type {
  return new Uint8Array(out) as Felt252Type;
}

// ============ Exported Functions ============

export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.felt_add(feltPtr(a), feltPtr(b), ptr(out));
  checkResult(result);
  return copyResult(out);
}

export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.felt_sub(feltPtr(a), feltPtr(b), ptr(out));
  checkResult(result);
  return copyResult(out);
}

export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.felt_mul(feltPtr(a), feltPtr(b), ptr(out));
  checkResult(result);
  return copyResult(out);
}

export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.felt_div(feltPtr(a), feltPtr(b), ptr(out));
  checkResult(result);
  return copyResult(out);
}

export function feltNeg(a: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.felt_neg(feltPtr(a), ptr(out));
  checkResult(result);
  return copyResult(out);
}

export function feltInverse(a: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.felt_inverse(feltPtr(a), ptr(out));
  checkResult(result);
  return copyResult(out);
}

export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.felt_pow(feltPtr(base), feltPtr(exp), ptr(out));
  checkResult(result);
  return copyResult(out);
}

export function feltSqrt(a: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.felt_sqrt(feltPtr(a), ptr(out));
  checkResult(result);
  return copyResult(out);
}

export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.starknet_pedersen_hash(
    feltPtr(a),
    feltPtr(b),
    ptr(out)
  );
  checkResult(result);
  return copyResult(out);
}

export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.starknet_poseidon_hash(
    feltPtr(a),
    feltPtr(b),
    ptr(out)
  );
  checkResult(result);
  return copyResult(out);
}

export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  const lib = loadLibrary()!;
  // Pack inputs into contiguous buffer
  const packed = new Uint8Array(inputs.length * 32);
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input) {
      throw new Error(`Invalid input at index ${i}`);
    }
    packed.set(input, i * 32);
  }
  const out = new Uint8Array(32);
  const result = lib.symbols.starknet_poseidon_hash_many(
    ptr(packed),
    inputs.length,
    ptr(out)
  );
  checkResult(result);
  return copyResult(out);
}

/**
 * Standard Keccak256 hash (full 32 bytes)
 */
export function keccak256(data: Uint8Array): Uint8Array {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const dataPtr = data.length > 0 ? ptr(data) : ptr(new Uint8Array(1));
  const result = lib.symbols.keccak256(
    dataPtr,
    data.length,
    ptr(out)
  );
  checkResult(result);
  return new Uint8Array(out);
}

/**
 * Starknet Keccak256 (truncated to 250 bits, returns Felt252)
 */
export function snKeccak256(data: Uint8Array): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const dataPtr = data.length > 0 ? ptr(data) : ptr(new Uint8Array(1));
  const result = lib.symbols.starknet_keccak256(
    dataPtr,
    data.length,
    ptr(out)
  );
  checkResult(result);
  return copyResult(out);
}

export function getPublicKey(privateKey: Felt252Type): Felt252Type {
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.starknet_get_public_key(feltPtr(privateKey), ptr(out));
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
  const lib = loadLibrary()!;
  const outR = new Uint8Array(32);
  const outS = new Uint8Array(32);
  const result = lib.symbols.starknet_sign(
    feltPtr(privateKey),
    feltPtr(messageHash),
    ptr(outR),
    ptr(outS)
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
  const lib = loadLibrary()!;
  const result = lib.symbols.starknet_verify(
    feltPtr(publicKey),
    feltPtr(messageHash),
    feltPtr(r),
    feltPtr(s)
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
  const lib = loadLibrary()!;
  const out = new Uint8Array(32);
  const result = lib.symbols.starknet_recover(
    feltPtr(messageHash),
    feltPtr(r),
    feltPtr(s),
    feltPtr(v),
    ptr(out)
  );
  checkResult(result);
  return copyResult(out);
}
