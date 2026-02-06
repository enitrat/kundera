import type { Felt252Type } from "../../primitives/Felt252/types.js";

type NativeLib = {
	getPublicKey: (privateKey: Felt252Type) => Felt252Type;
};

let nativeLib: NativeLib | null = null;

/**
 * Ensure native library is loaded.
 * Must be called before using getPublicKeySync.
 */
export async function ensureLoaded(): Promise<NativeLib> {
	if (!nativeLib) {
		const native = await import("../../native/index.js");
		nativeLib = {
			getPublicKey: native.getPublicKey,
		};
	}
	return nativeLib;
}

/**
 * Derive public key from private key (async, loads native if needed)
 */
export async function getPublicKey(
	privateKey: Felt252Type,
): Promise<Felt252Type> {
	const lib = await ensureLoaded();
	return lib.getPublicKey(privateKey);
}

/**
 * Derive public key (sync, requires ensureLoaded() first)
 * @throws Error if native library not loaded
 */
export function getPublicKeySync(privateKey: Felt252Type): Felt252Type {
	if (!nativeLib) {
		throw new Error("Native library not loaded - call ensureLoaded() first");
	}
	return nativeLib.getPublicKey(privateKey);
}

/**
 * Check if native library is loaded
 */
export function isLoaded(): boolean {
	return nativeLib !== null;
}
