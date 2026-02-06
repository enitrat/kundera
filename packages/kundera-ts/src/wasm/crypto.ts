/**
 * WASM Crypto Functions
 *
 * Thin wrappers around WASM crypto operations.
 */

import type { Signature } from "../api-interface.js";
import { Felt252, type Felt252Type } from "../primitives/index.js";
import {
	isWasmLoaded,
	wasmFeltAdd,
	wasmFeltSub,
	wasmFeltMul,
	wasmFeltDiv,
	wasmFeltNeg,
	wasmFeltInverse,
	wasmFeltPow,
	wasmFeltSqrt,
	wasmPedersenHash,
	wasmPoseidonHash,
	wasmPoseidonHashMany,
	wasmGetPublicKey,
	wasmSign,
	wasmVerify,
	wasmRecover,
} from "../wasm-loader/index.js";

/**
 * Ensure WASM is loaded, throw helpful error if not
 */
function ensureWasmLoaded(): void {
	if (!isWasmLoaded()) {
		throw new Error("WASM not loaded. Call `await loadWasmCrypto()` first.");
	}
}

// ============ Availability ============

/**
 * Native is never available in WASM entrypoint
 */
export function isNativeAvailable(): boolean {
	return false;
}

// ============ Hashing ============

export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmPedersenHash(a, b));
}

export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmPoseidonHash(a, b));
}

export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmPoseidonHashMany(inputs));
}

export function snKeccak(_data: Uint8Array): Felt252Type {
	throw new Error("Not implemented");
}

// ============ Felt Arithmetic ============

export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmFeltAdd(a, b));
}

export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmFeltSub(a, b));
}

export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmFeltMul(a, b));
}

export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmFeltDiv(a, b));
}

export function feltNeg(a: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmFeltNeg(a));
}

export function feltInverse(a: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmFeltInverse(a));
}

export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmFeltPow(base, exp));
}

export function feltSqrt(a: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmFeltSqrt(a));
}

// ============ ECDSA ============

export function sign(
	privateKey: Felt252Type,
	messageHash: Felt252Type,
): Signature {
	ensureWasmLoaded();
	const signature = wasmSign(privateKey, messageHash);
	return { r: Felt252(signature.r), s: Felt252(signature.s) };
}

export function verify(
	publicKey: Felt252Type,
	messageHash: Felt252Type,
	signature: Signature,
): boolean {
	ensureWasmLoaded();
	return wasmVerify(publicKey, messageHash, signature.r, signature.s);
}

export function getPublicKey(privateKey: Felt252Type): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmGetPublicKey(privateKey));
}

export function recover(
	messageHash: Felt252Type,
	r: Felt252Type,
	s: Felt252Type,
	v: Felt252Type,
): Felt252Type {
	ensureWasmLoaded();
	return Felt252(wasmRecover(messageHash, r, s, v));
}
