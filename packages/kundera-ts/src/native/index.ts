/**
 * Kundera Native Entrypoint
 *
 * Native FFI entrypoint for Bun and Node.js runtimes.
 * Uses bun:ffi in Bun, ffi-napi in Node.
 *
 * Usage:
 *   import * as kundera from 'kundera-sn/native';
 *   const hash = kundera.pedersenHash(a, b); // Uses native FFI
 */

import type { Signature } from '../api-interface.js';
import { Felt252, type Felt252Type } from '../primitives/index.js';

// ============ Re-export Primitives (unchanged) ============

export {
  // Constants
  FIELD_PRIME,
  MAX_ADDRESS,
  MAX_CONTRACT_ADDRESS,
  MAX_ETH_ADDRESS,
  // Felt252
  Felt252,
  type Felt252Type,
  type Felt252Input,
  // ContractAddress
  ContractAddress,
  type ContractAddressType,
  // ClassHash
  ClassHash,
  type ClassHashType,
  // StorageKey
  StorageKey,
  type StorageKeyType,
  // EthAddress
  EthAddress,
  type EthAddressType,
  // Namespaces (Felt is merged with crypto ops below)
  Address,
  Class,
  Storage,
} from '../primitives/index.js';

// ============ Re-export Serde (unchanged) ============

export {
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
} from '../serde/index.js';


// ============ Native FFI Loader ============

export {
  isNativeAvailable,
  getNativeLibraryPath,
  StarkResult,
} from './loader.js';

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

// ============ Helper ============

/**
 * Ensure native is available, throw helpful error if not
 */
function ensureNativeAvailable(): void {
  if (!isNativeAvailable()) {
    throw new Error(
      'Native FFI not available. Use Bun or Node.js with ffi-napi, and build with: cargo build --release'
    );
  }
}

// ============ Crypto (Native-only) ============

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
  // Convert string to bytes if needed
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

export type { Signature } from '../api-interface.js';

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

// ============ Crypto Namespaces ============

export const Pedersen = {
  hash: pedersenHash,
} as const;

export const Poseidon = {
  hash: poseidonHash,
  hashMany: poseidonHashMany,
} as const;

// Merge Felt primitives with crypto ops (preserve call signature)
import { Felt as FeltPrimitives } from '../primitives/index.js';

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

export const StarkCurve = {
  sign,
  verify,
  getPublicKey,
  recover,
} as const;

// ============ API Parity Check ============

import type { KunderaAPI as _KunderaAPI } from '../api-interface.js';
import {
  FIELD_PRIME,
  MAX_ADDRESS,
  MAX_CONTRACT_ADDRESS,
  MAX_ETH_ADDRESS,
  ContractAddress,
  ClassHash,
  StorageKey,
  EthAddress,
  Address,
  Class,
  Storage,
} from '../primitives/index.js';

import {
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
} from '../serde/index.js';

// Type validator - ensures all exports match _KunderaAPI interface
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _nativeAPI = {
  // Primitives
  FIELD_PRIME,
  MAX_ADDRESS,
  MAX_CONTRACT_ADDRESS,
  MAX_ETH_ADDRESS,
  Felt252,
  ContractAddress,
  ClassHash,
  StorageKey,
  EthAddress,
  Address,
  Class,
  Storage,
  // Crypto
  isNativeAvailable,
  isWasmAvailable,
  isWasmLoaded,
  loadWasmCrypto,
  pedersenHash,
  poseidonHash,
  poseidonHashMany,
  snKeccak,
  feltAdd,
  feltSub,
  feltMul,
  feltDiv,
  feltNeg,
  feltInverse,
  feltPow,
  feltSqrt,
  sign,
  verify,
  getPublicKey,
  recover,
  Pedersen,
  Poseidon,
  Felt,
  StarkCurve,
  // Serde
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
} satisfies _KunderaAPI;

// Explicitly mark as used for type validation
void _nativeAPI;
