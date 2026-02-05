import type { Felt252Type } from '../../primitives/Felt252/types.js';
import type { PedersenHash } from './types.js';

type WasmModule = {
  wasmPedersenHash: (a: Felt252Type, b: Felt252Type) => Felt252Type;
};

let wasmModule: WasmModule | null = null;

/**
 * Ensure WASM module is loaded.
 * Must be called before using hashSync.
 */
export async function ensureLoaded(): Promise<WasmModule> {
  if (!wasmModule) {
    const loader = await import('../../wasm-loader/index.js');
    await loader.loadWasmCrypto();
    wasmModule = {
      wasmPedersenHash: loader.wasmPedersenHash,
    };
  }
  return wasmModule;
}

/**
 * Pedersen hash of two felts (async, loads WASM if needed)
 */
export async function hash(a: Felt252Type, b: Felt252Type): Promise<PedersenHash> {
  const wasm = await ensureLoaded();
  return wasm.wasmPedersenHash(a, b);
}

/**
 * Pedersen hash of two felts (sync, requires ensureLoaded() first)
 * @throws Error if WASM not loaded
 */
export function hashSync(a: Felt252Type, b: Felt252Type): PedersenHash {
  if (!wasmModule) {
    throw new Error('WASM not loaded - call ensureLoaded() first');
  }
  return wasmModule.wasmPedersenHash(a, b);
}

/**
 * Check if WASM module is loaded
 */
export function isLoaded(): boolean {
  return wasmModule !== null;
}
