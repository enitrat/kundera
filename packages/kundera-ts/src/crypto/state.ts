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
const KUNDERA_CRYPTO_STATE = Symbol.for("kundera-crypto-state");

interface CryptoState {
	native: typeof import("../native/index.js") | null;
	nativeChecked: boolean;
	wasm: typeof import("../wasm-loader/index.js") | null;
	wasmChecked: boolean;
	wasmLoaded: boolean;
}

type GlobalCryptoStateHost = typeof globalThis & {
	[KUNDERA_CRYPTO_STATE]?: CryptoState;
	require?: (id: string) => unknown;
};

const globalStateHost = globalThis as GlobalCryptoStateHost;

const createInitialState = (): CryptoState => ({
	native: null,
	nativeChecked: false,
	wasm: null,
	wasmChecked: false,
	wasmLoaded: false,
});

// Initialize or retrieve the global state
const state: CryptoState =
	globalStateHost[KUNDERA_CRYPTO_STATE] ?? createInitialState();
if (globalStateHost[KUNDERA_CRYPTO_STATE] === undefined) {
	globalStateHost[KUNDERA_CRYPTO_STATE] = state;
}

function tryRequire(path: string): unknown | null {
	const req = globalStateHost.require;
	if (typeof req !== "function") return null;
	return req(path);
}

function isNativeModule(
	value: unknown,
): value is NonNullable<CryptoState["native"]> {
	return (
		typeof value === "object" &&
		value !== null &&
		"isNativeAvailable" in value &&
		typeof (value as { isNativeAvailable?: unknown }).isNativeAvailable ===
			"function"
	);
}

function isWasmModule(
	value: unknown,
): value is NonNullable<CryptoState["wasm"]> {
	return typeof value === "object" && value !== null;
}

/**
 * Check and load native FFI if available (Bun only)
 */
export function getNative(): CryptoState["native"] {
	if (!state.nativeChecked) {
		state.nativeChecked = true;
		try {
			const hasBun =
				typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";
			if (hasBun) {
				const nativeModule = tryRequire("../native/index.js");
				if (
					!isNativeModule(nativeModule) ||
					!nativeModule.isNativeAvailable()
				) {
					state.native = null;
				} else {
					state.native = nativeModule;
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
export function getWasmModule(): CryptoState["wasm"] {
	if (!state.wasmChecked) {
		state.wasmChecked = true;
		try {
			const wasmModule = tryRequire("../wasm-loader/index.js");
			state.wasm = isWasmModule(wasmModule) ? wasmModule : null;
		} catch {
			state.wasm = null;
		}
	}
	return state.wasm;
}

export function getWasm(): CryptoState["wasm"] | null {
	const w = getWasmModule();
	return state.wasmLoaded ? w : null;
}

export function setWasmLoaded(loaded: boolean): void {
	state.wasmLoaded = loaded;
}

export function setWasmModule(w: CryptoState["wasm"]): void {
	state.wasm = w;
	state.wasmChecked = true;
}

export function isWasmLoadedInternal(): boolean {
	return state.wasmLoaded;
}
