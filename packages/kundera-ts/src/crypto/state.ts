/**
 * Crypto Backend State
 *
 * Manages native FFI and WASM backend detection and loading.
 *
 * Uses a global singleton to share state across all module instances.
 * This fixes the ESM module duplication issue where different imports
 * would have separate state variables.
 */

// Global singleton to share WASM state across all module instances
const KUNDERA_CRYPTO_STATE = Symbol.for('kundera-crypto-state');

interface CryptoState {
  native: typeof import('../native/index.js') | null;
  nativeChecked: boolean;
  wasm: typeof import('../wasm-loader/index.js') | null;
  wasmChecked: boolean;
  wasmLoaded: boolean;
}

// Initialize or retrieve the global state
const state: CryptoState = ((globalThis as any)[KUNDERA_CRYPTO_STATE] ??= {
  native: null,
  nativeChecked: false,
  wasm: null,
  wasmChecked: false,
  wasmLoaded: false,
});

function tryRequire(path: string): any | null {
  const req = (globalThis as { require?: (id: string) => any }).require;
  if (typeof req !== 'function') return null;
  return req(path);
}

/**
 * Check and load native FFI if available (Bun only)
 */
export function getNative(): CryptoState['native'] {
  if (!state.nativeChecked) {
    state.nativeChecked = true;
    try {
      const hasBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined';
      if (hasBun) {
        state.native = tryRequire('../native/index.js');
        if (!state.native?.isNativeAvailable()) {
          state.native = null;
        }
      }
    } catch {
      state.native = null;
    }
  }
  return state.native;
}

/**
 * Get WASM module (must be loaded first via loadWasmCrypto)
 */
export function getWasmModule(): CryptoState['wasm'] {
  if (!state.wasmChecked) {
    state.wasmChecked = true;
    try {
      state.wasm = tryRequire('../wasm-loader/index.js');
    } catch {
      state.wasm = null;
    }
  }
  return state.wasm;
}

export function getWasm(): CryptoState['wasm'] | null {
  const w = getWasmModule();
  return state.wasmLoaded ? w : null;
}

export function setWasmLoaded(loaded: boolean): void {
  state.wasmLoaded = loaded;
}

export function setWasmModule(w: CryptoState['wasm']): void {
  state.wasm = w;
  state.wasmChecked = true;
}

export function isWasmLoadedInternal(): boolean {
  return state.wasmLoaded;
}
