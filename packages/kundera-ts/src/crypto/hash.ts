/**
 * Crypto Hashing Functions
 */

import { Felt252, type Felt252Type } from '../primitives/index.js';
import { getNative, getWasm } from './state.js';

/**
 * Pedersen hash of two felts
 */
export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.pedersenHash(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmPedersenHash(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Poseidon hash of two felts
 */
export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.poseidonHash(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmPoseidonHash(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Poseidon hash of multiple felts
 */
export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.poseidonHashMany(inputs));

  const w = getWasm();
  if (w) return Felt252(w.wasmPoseidonHashMany(inputs));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * sn_keccak - Truncated Keccak256 (first 250 bits)
 *
 * Computes keccak256(data) and masks to 250 bits for use as Starknet selector.
 */
export function snKeccak(data: Uint8Array | string): Felt252Type {
  // Convert string to bytes if needed
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  const n = getNative();
  if (n) return Felt252(n.snKeccak(bytes));

  const w = getWasm();
  if (w) return Felt252(w.wasmKeccak256(bytes));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}
