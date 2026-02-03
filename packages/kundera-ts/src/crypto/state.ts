/**
 * Crypto Backend State
 *
 * Manages native FFI and WASM backend detection and loading.
 */

// Native FFI (Bun only)
let native: typeof import('../native/index.js') | null = null;
let nativeChecked = false;

// WASM loader
let wasm: typeof import('../wasm-loader/index.js') | null = null;
let wasmChecked = false;
let wasmLoaded = false;

function tryRequire(path: string): any | null {
  const req = (globalThis as { require?: (id: string) => any }).require;
  if (typeof req !== 'function') return null;
  return req(path);
}

/**
 * Check and load native FFI if available (Bun only)
 */
export function getNative(): typeof native {
  if (!nativeChecked) {
    nativeChecked = true;
    try {
      const hasBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined';
      if (hasBun) {
        native = tryRequire('../native/index.js');
        if (!native?.isNativeAvailable()) {
          native = null;
        }
      }
    } catch {
      native = null;
    }
  }
  return native;
}

/**
 * Get WASM module (must be loaded first via loadWasmCrypto)
 */
export function getWasmModule(): typeof wasm {
  if (!wasmChecked) {
    wasmChecked = true;
    try {
      wasm = tryRequire('../wasm-loader/index.js');
    } catch {
      wasm = null;
    }
  }
  return wasm;
}

export function getWasm(): typeof wasm | null {
  const w = getWasmModule();
  return wasmLoaded ? w : null;
}

export function setWasmLoaded(loaded: boolean): void {
  wasmLoaded = loaded;
}

export function setWasmModule(w: typeof wasm): void {
  wasm = w;
  wasmChecked = true;
}

export function isWasmLoadedInternal(): boolean {
  return wasmLoaded;
}
