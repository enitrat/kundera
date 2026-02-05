/**
 * Starknet Crypto
 *
 * Cryptographic operations for Starknet.
 *
 * Three backends available:
 * - Pure JS (default): Works everywhere, no setup
 * - Native FFI: Fastest, Bun/Node only, import from '@kundera-sn/kundera-ts/native'
 * - WASM: Fast, browser-compatible, import from '@kundera-sn/kundera-ts/wasm'
 *
 * This module exports pure JS implementations by default.
 * For native/wasm, use explicit imports.
 */

import type { Felt252Type } from '../primitives/index.js';

// ============ Pure JS Hash Functions (Default) ============

// Re-export from new modules
export { Keccak256 } from './Keccak256/index.js';
export { hash as keccak256, hashHex as keccak256Hex } from './Keccak256/index.js';
export type { Keccak256Hash } from './Keccak256/index.js';

export { Pedersen } from './Pedersen/index.js';
export { hash as pedersenHash, hashMany as pedersenHashMany } from './Pedersen/index.js';
export type { PedersenHash } from './Pedersen/index.js';

export { Poseidon } from './Poseidon/index.js';
export { hash as poseidonHash, hashMany as poseidonHashMany } from './Poseidon/index.js';
export type { PoseidonHash } from './Poseidon/index.js';

// ============ Starknet Keccak (truncated to 250 bits) ============

import { keccak_256 } from '@noble/hashes/sha3.js';
import { Felt252 } from '../primitives/index.js';

/** Mask for 250 bits (Starknet selector) */
const MASK_250 = (1n << 250n) - 1n;

/**
 * sn_keccak - Truncated Keccak256 (first 250 bits)
 *
 * Computes keccak256(data) and masks to 250 bits for use as Starknet selector.
 * Pure JS implementation using @noble/hashes.
 */
export function snKeccak(data: Uint8Array | string): Felt252Type {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = keccak_256(bytes);
  // Convert to bigint and mask to 250 bits
  let result = 0n;
  for (let i = 0; i < hash.length; i++) {
    result = (result << 8n) | BigInt(hash[i]!);
  }
  return Felt252(result & MASK_250);
}

// ============ Felt Arithmetic (requires native/wasm) ============
// These operations need native or wasm backend - no pure JS impl yet.
// Import from '@kundera-sn/kundera-ts/native' or '@kundera-sn/kundera-ts/wasm' explicitly.

// Re-export from legacy module for backward compatibility
export {
  feltAdd,
  feltSub,
  feltMul,
  feltDiv,
  feltNeg,
  feltInverse,
  feltPow,
  feltSqrt,
} from './arithmetic.js';

// ============ ECDSA (requires native/wasm) ============
// ECDSA operations need native or wasm backend - no pure JS impl yet.

export type { Signature } from './ecdsa.js';
export { sign, verify, getPublicKey, recover } from './ecdsa.js';

// ============ Legacy Initialization (for backward compat) ============

export {
  loadWasmCrypto,
  isNativeAvailable,
  isWasmAvailable,
  isWasmLoaded,
} from './availability.js';

// ============ StarkCurve Namespace ============

export { StarkCurve } from './namespaces/StarkCurve.js';

// ============ Account Hash Functions ============

export {
  hashTipAndResourceBounds,
  encodeDAModes,
  hashCalldata,
  computeInvokeV3Hash,
  computeDeclareV3Hash,
  computeDeployAccountV3Hash,
  computeContractAddress,
  computeSelector,
  EXECUTE_SELECTOR,
} from './account/index.js';

// Re-export account types and constants
export * from './account-types.js';

// ============ Extended Felt Namespace ============

import { Felt as FeltPrimitives } from '../primitives/index.js';
import { feltAdd, feltSub, feltMul, feltDiv, feltNeg, feltInverse, feltPow, feltSqrt } from './arithmetic.js';

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
} as const);
