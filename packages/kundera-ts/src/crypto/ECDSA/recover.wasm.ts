import type { Felt252Type } from '../../primitives/Felt252/types.js';

type WasmLib = {
  wasmRecover: (messageHash: Felt252Type, r: Felt252Type, s: Felt252Type, v: Felt252Type) => Felt252Type;
};

let wasmLib: WasmLib | null = null;

/**
 * Ensure WASM module is loaded.
 * Must be called before using recoverSync.
 */
export async function ensureLoaded(): Promise<WasmLib> {
  if (!wasmLib) {
    const wasm = await import('../../wasm-loader/index.js');
    await wasm.loadWasmCrypto();
    wasmLib = {
      wasmRecover: wasm.wasmRecover,
    };
  }
  return wasmLib;
}

/**
 * Recover public key from signature (async, loads WASM if needed)
 */
export async function recover(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Promise<Felt252Type> {
  const lib = await ensureLoaded();
  return lib.wasmRecover(messageHash, r, s, v);
}

/**
 * Recover public key (sync, requires ensureLoaded() first)
 * @throws Error if WASM not loaded
 */
export function recoverSync(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Felt252Type {
  if (!wasmLib) {
    throw new Error('WASM not loaded - call ensureLoaded() first');
  }
  return wasmLib.wasmRecover(messageHash, r, s, v);
}

/**
 * Check if WASM is loaded
 */
export function isLoaded(): boolean {
  return wasmLib !== null;
}
