/**
 * Keccak256 Native FFI Backend
 *
 * Uses the Rust FFI for standard Keccak256 hashing (full 32 bytes).
 */

import type { Keccak256Hash } from "./types.js";

type NativeLib = {
	keccak256: (data: Uint8Array) => Uint8Array;
};

let nativeLib: NativeLib | null = null;

/**
 * Ensure native library is loaded.
 * Must be called before using sync functions.
 */
export async function ensureLoaded(): Promise<NativeLib> {
	if (!nativeLib) {
		const loader = await import("../../native/loader.js");
		nativeLib = {
			keccak256: loader.keccak256,
		};
	}
	return nativeLib;
}

/**
 * Check if backend is loaded
 */
export function isLoaded(): boolean {
	return nativeLib !== null;
}

/**
 * Convert input to Uint8Array
 */
function toBytes(data: Uint8Array | string): Uint8Array {
	if (typeof data === "string") {
		return new TextEncoder().encode(data);
	}
	return data;
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}

/**
 * Keccak256 hash (async, loads native if needed)
 * @param data - Input data to hash
 * @returns 32-byte hash
 */
export async function hash(data: Uint8Array | string): Promise<Keccak256Hash> {
	const lib = await ensureLoaded();
	return lib.keccak256(toBytes(data)) as Keccak256Hash;
}

/**
 * Keccak256 hash (sync, requires ensureLoaded() first)
 * @param data - Input data to hash
 * @returns 32-byte hash
 * @throws Error if native library not loaded
 */
export function hashSync(data: Uint8Array | string): Keccak256Hash {
	if (!nativeLib) {
		throw new Error("Native library not loaded - call ensureLoaded() first");
	}
	return nativeLib.keccak256(toBytes(data)) as Keccak256Hash;
}

/**
 * Keccak256 hash returning hex string (async)
 */
export async function hashHex(data: Uint8Array | string): Promise<string> {
	const result = await hash(data);
	return bytesToHex(result);
}

/**
 * Keccak256 hash returning hex string (sync)
 */
export function hashHexSync(data: Uint8Array | string): string {
	const result = hashSync(data);
	return bytesToHex(result);
}
