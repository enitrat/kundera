import type { Felt252Type } from "../../primitives/Felt252/types.js";

type WasmLib = {
	wasmGetPublicKey: (privateKey: Felt252Type) => Felt252Type;
};

let wasmLib: WasmLib | null = null;

/**
 * Ensure WASM module is loaded.
 * Must be called before using getPublicKeySync.
 */
export async function ensureLoaded(): Promise<WasmLib> {
	if (!wasmLib) {
		const wasm = await import("../../wasm-loader/index.js");
		await wasm.loadWasmCrypto();
		wasmLib = {
			wasmGetPublicKey: wasm.wasmGetPublicKey,
		};
	}
	return wasmLib;
}

/**
 * Derive public key from private key (async, loads WASM if needed)
 */
export async function getPublicKey(
	privateKey: Felt252Type,
): Promise<Felt252Type> {
	const lib = await ensureLoaded();
	return lib.wasmGetPublicKey(privateKey);
}

/**
 * Derive public key (sync, requires ensureLoaded() first)
 * @throws Error if WASM not loaded
 */
export function getPublicKeySync(privateKey: Felt252Type): Felt252Type {
	if (!wasmLib) {
		throw new Error("WASM not loaded - call ensureLoaded() first");
	}
	return wasmLib.wasmGetPublicKey(privateKey);
}

/**
 * Check if WASM is loaded
 */
export function isLoaded(): boolean {
	return wasmLib !== null;
}
