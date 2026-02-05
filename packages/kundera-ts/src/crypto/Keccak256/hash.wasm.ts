/**
 * Keccak256 WASM Backend
 *
 * Note: The WASM module currently only exposes sn_keccak (250-bit truncated Starknet keccak),
 * not standard Keccak256. This backend delegates to the pure JS implementation.
 *
 * For standard Keccak256, use the pure JS backend which uses @noble/hashes.
 */

import type { Keccak256Hash } from './types.js';
import { hash as pureHash, hashHex as pureHashHex } from './hash.js';

let loaded = false;

/**
 * Ensure WASM module is loaded (no-op for Keccak256, kept for API consistency)
 */
export async function ensureLoaded(): Promise<void> {
  // WASM doesn't have standard Keccak256, so we use pure JS
  // This function exists for API consistency with other crypto backends
  loaded = true;
}

/**
 * Check if backend is loaded
 */
export function isLoaded(): boolean {
  return loaded;
}

/**
 * Keccak256 hash (delegates to pure JS - WASM only has sn_keccak)
 * @param data - Input data to hash
 * @returns 32-byte hash
 */
export async function hash(data: Uint8Array | string): Promise<Keccak256Hash> {
  await ensureLoaded();
  return pureHash(data);
}

/**
 * Keccak256 hash (sync)
 * @param data - Input data to hash
 * @returns 32-byte hash
 */
export function hashSync(data: Uint8Array | string): Keccak256Hash {
  return pureHash(data);
}

/**
 * Keccak256 hash returning hex string (async)
 */
export async function hashHex(data: Uint8Array | string): Promise<string> {
  await ensureLoaded();
  return pureHashHex(data);
}

/**
 * Keccak256 hash returning hex string (sync)
 */
export function hashHexSync(data: Uint8Array | string): string {
  return pureHashHex(data);
}
