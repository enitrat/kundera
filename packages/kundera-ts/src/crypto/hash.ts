/**
 * Crypto Hashing Functions
 */

import type { Felt252Type } from '../primitives/index.js';
import { withCrypto } from './helpers.js';

/**
 * Pedersen hash of two felts
 */
export const pedersenHash = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => n.pedersenHash(a, b),
  wasm: (w, a, b) => w.wasmPedersenHash(a, b),
});

/**
 * Poseidon hash of two felts
 */
export const poseidonHash = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => n.poseidonHash(a, b),
  wasm: (w, a, b) => w.wasmPoseidonHash(a, b),
});

/**
 * Poseidon hash of multiple felts
 */
export const poseidonHashMany = withCrypto<[Felt252Type[]], Felt252Type>({
  native: (n, inputs) => n.poseidonHashMany(inputs),
  wasm: (w, inputs) => w.wasmPoseidonHashMany(inputs),
});

/**
 * sn_keccak - Truncated Keccak256 (first 250 bits)
 *
 * Computes keccak256(data) and masks to 250 bits for use as Starknet selector.
 */
export function snKeccak(data: Uint8Array | string): Felt252Type {
  // Convert string to bytes if needed - this preprocessing is needed before calling withCrypto
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  return snKeccakBytes(bytes);
}

// Internal helper that takes only Uint8Array
const snKeccakBytes = withCrypto<[Uint8Array], Felt252Type>({
  native: (n, bytes) => n.snKeccak(bytes),
  wasm: (w, bytes) => w.wasmKeccak256(bytes),
});
