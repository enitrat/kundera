import type { Felt252Type } from '../../primitives/Felt252/types.js';
import type { Signature } from './types.js';

type WasmLib = {
  wasmVerify: (publicKey: Felt252Type, messageHash: Felt252Type, r: Felt252Type, s: Felt252Type) => boolean;
};

let wasmLib: WasmLib | null = null;

/**
 * Ensure WASM module is loaded.
 * Must be called before using verifySync.
 */
export async function ensureLoaded(): Promise<WasmLib> {
  if (!wasmLib) {
    const wasm = await import('../../wasm-loader/index.js');
    await wasm.loadWasmCrypto();
    wasmLib = {
      wasmVerify: wasm.wasmVerify,
    };
  }
  return wasmLib;
}

/**
 * Verify STARK curve ECDSA signature (async, loads WASM if needed)
 */
export async function verify(
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  signature: Signature
): Promise<boolean> {
  const lib = await ensureLoaded();
  return lib.wasmVerify(publicKey, messageHash, signature.r, signature.s);
}

/**
 * Verify signature (sync, requires ensureLoaded() first)
 * @throws Error if WASM not loaded
 */
export function verifySync(
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  signature: Signature
): boolean {
  if (!wasmLib) {
    throw new Error('WASM not loaded - call ensureLoaded() first');
  }
  return wasmLib.wasmVerify(publicKey, messageHash, signature.r, signature.s);
}

/**
 * Check if WASM is loaded
 */
export function isLoaded(): boolean {
  return wasmLib !== null;
}
