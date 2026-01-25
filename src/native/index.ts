/**
 * Kundera Native Entrypoint
 *
 * Native FFI entrypoint for Bun and Node.js runtimes.
 * Uses bun:ffi in Bun, ffi-napi in Node.
 *
 * Usage:
 *   import * as kundera from 'kundera/native';
 *   const hash = kundera.pedersenHash(a, b); // Uses native FFI
 */

import type { Signature } from '../api-interface.js';
import type { Felt252Type } from '../primitives/index.js';

// ============ Re-export Primitives (unchanged) ============

export {
  // Constants
  FIELD_PRIME,
  MAX_CONTRACT_ADDRESS,
  // Felt252
  Felt252,
  type Felt252Type,
  type Felt252Input,
  fromHex,
  fromBigInt,
  fromBytes,
  toHex,
  toBigInt,
  isValid,
  isZero,
  equals,
  // ContractAddress
  ContractAddress,
  ContractAddressUnchecked,
  type ContractAddressType,
  isValidContractAddress,
  // ClassHash
  ClassHash,
  ClassHashUnchecked,
  type ClassHashType,
  // StorageKey
  StorageKey,
  StorageKeyUnchecked,
  type StorageKeyType,
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

// ============ Re-export RPC (unchanged) ============

export {
  StarknetRpcClient,
  createClient,
  mainnet,
  sepolia,
  type RpcClientConfig,
  type BlockId,
  type BlockTag,
  type BlockNumber,
  type BlockHash,
  type RpcError,
  type FunctionCall,
  type TransactionStatus,
  type BlockHeader,
  type ChainId,
  type Nonce,
  type StorageValue,
  type ContractClass,
} from '../rpc/index.js';

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
  return nativePedersenHash(a, b);
}

export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativePoseidonHash(a, b);
}

export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  ensureNativeAvailable();
  return nativePoseidonHashMany(inputs);
}

export function snKeccak(data: Uint8Array | string): Felt252Type {
  ensureNativeAvailable();
  // Convert string to bytes if needed
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return nativeKeccak256(bytes);
}

// ============ Felt Arithmetic ============

export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativeFeltAdd(a, b);
}

export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativeFeltSub(a, b);
}

export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativeFeltMul(a, b);
}

export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativeFeltDiv(a, b);
}

export function feltNeg(a: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativeFeltNeg(a);
}

export function feltInverse(a: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativeFeltInverse(a);
}

export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativeFeltPow(base, exp);
}

export function feltSqrt(a: Felt252Type): Felt252Type {
  ensureNativeAvailable();
  return nativeFeltSqrt(a);
}

// ============ ECDSA ============

export type { Signature } from '../api-interface.js';

export function sign(privateKey: Felt252Type, messageHash: Felt252Type): Signature {
  ensureNativeAvailable();
  return nativeSign(privateKey, messageHash);
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
  return nativeGetPublicKey(privateKey);
}

export function recover(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Felt252Type {
  ensureNativeAvailable();
  return nativeRecover(messageHash, r, s, v);
}

// ============ Crypto Namespaces ============

export const Pedersen = {
  hash: pedersenHash,
} as const;

export const Poseidon = {
  hash: poseidonHash,
  hashMany: poseidonHashMany,
} as const;

// Merge Felt primitives with crypto ops
import { Felt as FeltPrimitives } from '../primitives/index.js';

export const Felt = {
  ...FeltPrimitives,
  add: feltAdd,
  sub: feltSub,
  mul: feltMul,
  div: feltDiv,
  neg: feltNeg,
  inverse: feltInverse,
  pow: feltPow,
  sqrt: feltSqrt,
} as const;

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
  MAX_CONTRACT_ADDRESS,
  Felt252,
  fromHex,
  fromBigInt,
  fromBytes,
  toHex,
  toBigInt,
  isValid,
  isZero,
  equals,
  ContractAddress,
  ContractAddressUnchecked,
  isValidContractAddress,
  ClassHash,
  ClassHashUnchecked,
  StorageKey,
  StorageKeyUnchecked,
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

import {
  StarknetRpcClient,
  createClient,
  mainnet,
  sepolia,
} from '../rpc/index.js';

const _nativeAPI = {
  // Primitives
  FIELD_PRIME,
  MAX_CONTRACT_ADDRESS,
  Felt252,
  fromHex,
  fromBigInt,
  fromBytes,
  toHex,
  toBigInt,
  isValid,
  isZero,
  equals,
  ContractAddress,
  ContractAddressUnchecked,
  isValidContractAddress,
  ClassHash,
  ClassHashUnchecked,
  StorageKey,
  StorageKeyUnchecked,
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
  // RPC
  StarknetRpcClient,
  createClient,
  mainnet,
  sepolia,
} satisfies _KunderaAPI;
