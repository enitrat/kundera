/**
 * Kundera WASM Entrypoint
 *
 * WASM-first entrypoint for browser and Node.js environments.
 * Does NOT import bun:ffi - safe for all JS runtimes.
 *
 * Usage:
 *   import * as kundera from 'kundera/wasm';
 *   await kundera.loadWasmCrypto();
 *   const hash = kundera.pedersenHash(a, b);
 */

import type { KunderaAPI, Signature } from '../api-interface.js';
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

// ============ WASM Loader ============

export {
  loadWasmCrypto,
  isWasmAvailable,
  isWasmLoaded,
  getWasmPath,
} from '../wasm-loader/index.js';

import {
  isWasmLoaded,
  isWasmAvailable,
  loadWasmCrypto,
  wasmFeltAdd,
  wasmFeltSub,
  wasmFeltMul,
  wasmFeltDiv,
  wasmFeltNeg,
  wasmFeltInverse,
  wasmFeltPow,
  wasmFeltSqrt,
  wasmPedersenHash,
  wasmPoseidonHash,
  wasmPoseidonHashMany,
  wasmGetPublicKey,
  wasmSign,
  wasmVerify,
  wasmRecover,
} from '../wasm-loader/index.js';

// ============ Helper ============

/**
 * Ensure WASM is loaded, throw helpful error if not
 */
function ensureWasmLoaded(): void {
  if (!isWasmLoaded()) {
    throw new Error('WASM not loaded. Call `await loadWasmCrypto()` first.');
  }
}

// ============ Crypto (WASM-only) ============

/**
 * Native is never available in WASM entrypoint
 */
export function isNativeAvailable(): boolean {
  return false;
}

// Note: isWasmAvailable, isWasmLoaded, loadWasmCrypto already exported above

// ============ Hashing ============

export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmPedersenHash(a, b);
}

export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmPoseidonHash(a, b);
}

export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  ensureWasmLoaded();
  return wasmPoseidonHashMany(inputs);
}

export function snKeccak(_data: Uint8Array): Felt252Type {
  throw new Error('Not implemented');
}

// ============ Felt Arithmetic ============

export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmFeltAdd(a, b);
}

export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmFeltSub(a, b);
}

export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmFeltMul(a, b);
}

export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmFeltDiv(a, b);
}

export function feltNeg(a: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmFeltNeg(a);
}

export function feltInverse(a: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmFeltInverse(a);
}

export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmFeltPow(base, exp);
}

export function feltSqrt(a: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmFeltSqrt(a);
}

// ============ ECDSA ============

export type { Signature } from '../api-interface.js';

export function sign(privateKey: Felt252Type, messageHash: Felt252Type): Signature {
  ensureWasmLoaded();
  return wasmSign(privateKey, messageHash);
}

export function verify(
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  signature: Signature
): boolean {
  ensureWasmLoaded();
  return wasmVerify(publicKey, messageHash, signature.r, signature.s);
}

export function getPublicKey(privateKey: Felt252Type): Felt252Type {
  ensureWasmLoaded();
  return wasmGetPublicKey(privateKey);
}

export function recover(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Felt252Type {
  ensureWasmLoaded();
  return wasmRecover(messageHash, r, s, v);
}

// ============ Crypto Namespaces ============

export const Pedersen = {
  hash: pedersenHash,
} as const;

export const Poseidon = {
  hash: poseidonHash,
  hashMany: poseidonHashMany,
} as const;

// Note: This shadows the Felt from primitives, so we need to merge
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

const _wasmAPI = {
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
