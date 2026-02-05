import type { Felt252Type } from '../../primitives/Felt252/types.js';
import type { Signature } from './types.js';
import { Felt252 } from '../../primitives/index.js';

type WasmLib = {
  wasmSign: (privateKey: Felt252Type, messageHash: Felt252Type) => Signature;
};

let wasmLib: WasmLib | null = null;

/**
 * Ensure WASM module is loaded.
 * Must be called before using signSync.
 */
export async function ensureLoaded(): Promise<WasmLib> {
  if (!wasmLib) {
    const wasm = await import('../../wasm-loader/index.js');
    await wasm.loadWasmCrypto();
    wasmLib = {
      wasmSign: (privateKey, messageHash) => {
        const sig = wasm.wasmSign(privateKey, messageHash);
        return { r: Felt252(sig.r), s: Felt252(sig.s) };
      },
    };
  }
  return wasmLib;
}

/**
 * Sign message hash with STARK curve ECDSA (async, loads WASM if needed)
 */
export async function sign(privateKey: Felt252Type, messageHash: Felt252Type): Promise<Signature> {
  const lib = await ensureLoaded();
  return lib.wasmSign(privateKey, messageHash);
}

/**
 * Sign message hash (sync, requires ensureLoaded() first)
 * @throws Error if WASM not loaded
 */
export function signSync(privateKey: Felt252Type, messageHash: Felt252Type): Signature {
  if (!wasmLib) {
    throw new Error('WASM not loaded - call ensureLoaded() first');
  }
  return wasmLib.wasmSign(privateKey, messageHash);
}

/**
 * Check if WASM is loaded
 */
export function isLoaded(): boolean {
  return wasmLib !== null;
}
