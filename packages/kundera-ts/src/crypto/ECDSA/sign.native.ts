import type { Felt252Type } from "../../primitives/Felt252/types.js";
import type { Signature } from "./types.js";

type NativeLib = {
	sign: (privateKey: Felt252Type, messageHash: Felt252Type) => Signature;
};

let nativeLib: NativeLib | null = null;

/**
 * Ensure native library is loaded.
 * Must be called before using signSync.
 */
export async function ensureLoaded(): Promise<NativeLib> {
	if (!nativeLib) {
		const native = await import("../../native/index.js");
		nativeLib = {
			sign: native.sign,
		};
	}
	return nativeLib;
}

/**
 * Sign message hash with STARK curve ECDSA (async, loads native if needed)
 */
export async function sign(
	privateKey: Felt252Type,
	messageHash: Felt252Type,
): Promise<Signature> {
	const lib = await ensureLoaded();
	return lib.sign(privateKey, messageHash);
}

/**
 * Sign message hash (sync, requires ensureLoaded() first)
 * @throws Error if native library not loaded
 */
export function signSync(
	privateKey: Felt252Type,
	messageHash: Felt252Type,
): Signature {
	if (!nativeLib) {
		throw new Error("Native library not loaded - call ensureLoaded() first");
	}
	return nativeLib.sign(privateKey, messageHash);
}

/**
 * Check if native library is loaded
 */
export function isLoaded(): boolean {
	return nativeLib !== null;
}
