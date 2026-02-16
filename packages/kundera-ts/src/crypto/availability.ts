/**
 * Crypto Availability
 *
 * Functions to check backend availability and load WASM.
 */

import {
	getNative,
	getWasmModule,
	isWasmLoadedInternal,
	setWasmLoaded,
	setWasmModule,
} from "./state.js";

/**
 * Check if native crypto is available
 */
export function isNativeAvailable(): boolean {
	return getNative() !== null;
}

/**
 * Check if WASM crypto is available (file exists)
 */
export function isWasmAvailable(): boolean {
	const w = getWasmModule();
	return w?.isWasmAvailable() ?? false;
}

/**
 * Check if WASM crypto is loaded
 */
export function isWasmLoaded(): boolean {
	return isWasmLoadedInternal();
}

/**
 * Load WASM crypto module
 * Call this before using crypto functions if native is not available.
 */
export async function loadWasmCrypto(): Promise<void> {
	if (isWasmLoadedInternal()) return;

	let w = getWasmModule();
	if (!w) {
		try {
			w = await import("../wasm-loader/index.js");
			setWasmModule(w);
		} catch {
			throw new Error("WASM loader not available");
		}
	}

	await w.loadWasmCrypto();
	setWasmLoaded(true);
}

// Re-export state accessors for use by other modules
export { getNative, getWasm } from "./state.js";
export { getWasmModule } from "./state.js";
