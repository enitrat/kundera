import type { Felt252Type } from "../../primitives/Felt252/types.js";
import type { Signature } from "./types.js";

type NativeLib = {
	verify: (
		publicKey: Felt252Type,
		messageHash: Felt252Type,
		signature: Signature,
	) => boolean;
};

let nativeLib: NativeLib | null = null;

/**
 * Ensure native library is loaded.
 * Must be called before using verifySync.
 */
export async function ensureLoaded(): Promise<NativeLib> {
	if (!nativeLib) {
		const native = await import("../../native/index.js");
		nativeLib = {
			verify: native.verify,
		};
	}
	return nativeLib;
}

/**
 * Verify STARK curve ECDSA signature (async, loads native if needed)
 */
export async function verify(
	publicKey: Felt252Type,
	messageHash: Felt252Type,
	signature: Signature,
): Promise<boolean> {
	const lib = await ensureLoaded();
	return lib.verify(publicKey, messageHash, signature);
}

/**
 * Verify signature (sync, requires ensureLoaded() first)
 * @throws Error if native library not loaded
 */
export function verifySync(
	publicKey: Felt252Type,
	messageHash: Felt252Type,
	signature: Signature,
): boolean {
	if (!nativeLib) {
		throw new Error("Native library not loaded - call ensureLoaded() first");
	}
	return nativeLib.verify(publicKey, messageHash, signature);
}

/**
 * Check if native library is loaded
 */
export function isLoaded(): boolean {
	return nativeLib !== null;
}
