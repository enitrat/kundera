/**
 * Node.js FFI Backend
 *
 * Native FFI implementation using koffi.
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

// Lazily loaded koffi module
let koffi: any = null;
let koffiChecked = false;

// FFI function signatures (all return int32 status code)
type FfiFn = (...args: any[]) => number;

interface NativeFns {
  felt_add: FfiFn;
  felt_sub: FfiFn;
  felt_mul: FfiFn;
  felt_div: FfiFn;
  felt_neg: FfiFn;
  felt_inverse: FfiFn;
  felt_pow: FfiFn;
  felt_sqrt: FfiFn;
  starknet_pedersen_hash: FfiFn;
  starknet_poseidon_hash: FfiFn;
  starknet_poseidon_hash_many: FfiFn;
  keccak256: FfiFn;
  starknet_keccak256: FfiFn;
  starknet_get_public_key: FfiFn;
  starknet_sign: FfiFn;
  starknet_verify: FfiFn;
  starknet_recover: FfiFn;
}

// Loaded library instance and bound functions
let lib: any = null;
let libraryPath: string | null = null;
let fns: NativeFns | null = null;

/**
 * Try to load koffi
 */
function loadKoffi(): boolean {
  if (koffiChecked) return koffi !== null;
  koffiChecked = true;

  try {
    koffi = require('koffi');
    return true;
  } catch {
    koffi = null;
    return false;
  }
}

/**
 * Check if native library is available
 */
export function isAvailable(): boolean {
  if (!loadKoffi()) return false;
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
function loadLibrary(): NativeFns {
  if (fns !== null) return fns;

  if (!loadKoffi() || !koffi) {
    throw new Error(
      'koffi not available. Install with: npm install koffi'
    );
  }

  const path = getNativeLibPath();
  if (!path) {
    throw new Error(
      'Native library not found. Build with: cargo build --release'
    );
  }

  libraryPath = path;
  lib = koffi.load(path);

  // Declare all FFI functions
  // Type aliases for readability
  const ptr = 'void *';
  const i32 = 'int32_t';
  const u64 = 'uint64_t';

  fns = {
    // Felt arithmetic
    felt_add: lib.func(`${i32} felt_add(${ptr} a, ${ptr} b, ${ptr} out)`),
    felt_sub: lib.func(`${i32} felt_sub(${ptr} a, ${ptr} b, ${ptr} out)`),
    felt_mul: lib.func(`${i32} felt_mul(${ptr} a, ${ptr} b, ${ptr} out)`),
    felt_div: lib.func(`${i32} felt_div(${ptr} a, ${ptr} b, ${ptr} out)`),
    felt_neg: lib.func(`${i32} felt_neg(${ptr} a, ${ptr} out)`),
    felt_inverse: lib.func(`${i32} felt_inverse(${ptr} a, ${ptr} out)`),
    felt_pow: lib.func(`${i32} felt_pow(${ptr} base, ${ptr} exp, ${ptr} out)`),
    felt_sqrt: lib.func(`${i32} felt_sqrt(${ptr} a, ${ptr} out)`),
    // Hashing
    starknet_pedersen_hash: lib.func(`${i32} starknet_pedersen_hash(${ptr} a, ${ptr} b, ${ptr} out)`),
    starknet_poseidon_hash: lib.func(`${i32} starknet_poseidon_hash(${ptr} a, ${ptr} b, ${ptr} out)`),
    starknet_poseidon_hash_many: lib.func(`${i32} starknet_poseidon_hash_many(${ptr} data, ${u64} count, ${ptr} out)`),
    keccak256: lib.func(`${i32} keccak256(${ptr} data, ${u64} len, ${ptr} out)`),
    starknet_keccak256: lib.func(`${i32} starknet_keccak256(${ptr} data, ${u64} len, ${ptr} out)`),
    // ECDSA
    starknet_get_public_key: lib.func(`${i32} starknet_get_public_key(${ptr} privkey, ${ptr} out)`),
    starknet_sign: lib.func(`${i32} starknet_sign(${ptr} privkey, ${ptr} msg, ${ptr} r, ${ptr} s)`),
    starknet_verify: lib.func(`${i32} starknet_verify(${ptr} pubkey, ${ptr} msg, ${ptr} r, ${ptr} s)`),
    starknet_recover: lib.func(`${i32} starknet_recover(${ptr} msg, ${ptr} r, ${ptr} s, ${ptr} v, ${ptr} out)`),
  };

  return fns;
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
 * Copy result from output buffer to new Felt252
 */
function copyResult(out: Buffer): Felt252Type {
  return new Uint8Array(out) as Felt252Type;
}

// ============ Exported Functions ============

export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.felt_add(Buffer.from(a), Buffer.from(b), out);
  checkResult(result);
  return copyResult(out);
}

export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.felt_sub(Buffer.from(a), Buffer.from(b), out);
  checkResult(result);
  return copyResult(out);
}

export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.felt_mul(Buffer.from(a), Buffer.from(b), out);
  checkResult(result);
  return copyResult(out);
}

export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.felt_div(Buffer.from(a), Buffer.from(b), out);
  checkResult(result);
  return copyResult(out);
}

export function feltNeg(a: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.felt_neg(Buffer.from(a), out);
  checkResult(result);
  return copyResult(out);
}

export function feltInverse(a: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.felt_inverse(Buffer.from(a), out);
  checkResult(result);
  return copyResult(out);
}

export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.felt_pow(Buffer.from(base), Buffer.from(exp), out);
  checkResult(result);
  return copyResult(out);
}

export function feltSqrt(a: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.felt_sqrt(Buffer.from(a), out);
  checkResult(result);
  return copyResult(out);
}

export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.starknet_pedersen_hash(Buffer.from(a), Buffer.from(b), out);
  checkResult(result);
  return copyResult(out);
}

export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.starknet_poseidon_hash(Buffer.from(a), Buffer.from(b), out);
  checkResult(result);
  return copyResult(out);
}

export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  const fns = loadLibrary();
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
  const result = fns.starknet_poseidon_hash_many(packed, inputs.length, out);
  checkResult(result);
  return copyResult(out);
}

/**
 * Standard Keccak256 hash (full 32 bytes)
 */
export function keccak256(data: Uint8Array): Uint8Array {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const dataBuf = data.length > 0 ? Buffer.from(data) : Buffer.alloc(0);
  const result = fns.keccak256(dataBuf, data.length, out);
  checkResult(result);
  return new Uint8Array(out);
}

/**
 * Starknet Keccak256 (truncated to 250 bits, returns Felt252)
 */
export function snKeccak256(data: Uint8Array): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const dataBuf = data.length > 0 ? Buffer.from(data) : Buffer.alloc(0);
  const result = fns.starknet_keccak256(dataBuf, data.length, out);
  checkResult(result);
  return copyResult(out);
}

export function getPublicKey(privateKey: Felt252Type): Felt252Type {
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.starknet_get_public_key(Buffer.from(privateKey), out);
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
  const fns = loadLibrary();
  const outR = Buffer.alloc(32);
  const outS = Buffer.alloc(32);
  const result = fns.starknet_sign(
    Buffer.from(privateKey),
    Buffer.from(messageHash),
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
  const fns = loadLibrary();
  const result = fns.starknet_verify(
    Buffer.from(publicKey),
    Buffer.from(messageHash),
    Buffer.from(r),
    Buffer.from(s)
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
  const fns = loadLibrary();
  const out = Buffer.alloc(32);
  const result = fns.starknet_recover(
    Buffer.from(messageHash),
    Buffer.from(r),
    Buffer.from(s),
    Buffer.from(v),
    out
  );
  checkResult(result);
  return copyResult(out);
}
