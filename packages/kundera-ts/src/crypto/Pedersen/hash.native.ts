import type { Felt252Type } from "../../primitives/Felt252/types.js";
import type { PedersenHash } from "./types.js";

type NativeLib = {
	pedersenHash: (a: Felt252Type, b: Felt252Type) => Felt252Type;
};

let nativeLib: NativeLib | null = null;

/**
 * Ensure native library is loaded.
 * Must be called before using hashSync.
 */
export async function ensureLoaded(): Promise<NativeLib> {
	if (!nativeLib) {
		const loader = await import("../../native/loader.js");
		// The loader exports pedersenHash directly
		nativeLib = {
			pedersenHash: loader.pedersenHash,
		};
	}
	return nativeLib;
}

/**
 * Pedersen hash of two felts (async, loads native if needed)
 */
export async function hash(
	a: Felt252Type,
	b: Felt252Type,
): Promise<PedersenHash> {
	const lib = await ensureLoaded();
	return lib.pedersenHash(a, b);
}

/**
 * Pedersen hash of two felts (sync, requires ensureLoaded() first)
 * @throws Error if native library not loaded
 */
export function hashSync(a: Felt252Type, b: Felt252Type): PedersenHash {
	if (!nativeLib) {
		throw new Error("Native library not loaded - call ensureLoaded() first");
	}
	return nativeLib.pedersenHash(a, b);
}

/**
 * Check if native library is loaded
 */
export function isLoaded(): boolean {
	return nativeLib !== null;
}
