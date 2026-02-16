/**
 * Kundera WASM Entrypoint
 *
 * WASM-first entrypoint for browser and Node.js environments.
 * Does NOT import bun:ffi - safe for all JS runtimes.
 *
 * Usage:
 *   import * as kundera from 'kundera-sn/wasm';
 *   await kundera.loadWasmCrypto();
 *   const hash = kundera.pedersenHash(a, b);
 */

import type { Signature } from "../api-interface.js";
import { Felt252, type Felt252Type } from "../primitives/index.js";

// ============ Re-export Primitives (unchanged) ============

export {
	// Constants
	FIELD_PRIME,
	MAX_ADDRESS,
	MAX_CONTRACT_ADDRESS,
	MAX_ETH_ADDRESS,
	// Felt252
	Felt252,
	type Felt252Type,
	type Felt252Input,
	// ContractAddress
	ContractAddress,
	type ContractAddressType,
	// ClassHash
	ClassHash,
	type ClassHashType,
	// StorageKey
	StorageKey,
	type StorageKeyType,
	// EthAddress
	EthAddress,
	type EthAddressType,
	// Namespaces (Felt is merged with crypto ops below)
	Address,
	Class,
	Storage,
} from "../primitives/index.js";

// ============ Re-export Serde (unchanged) ============

export {
	serializeU256,
	deserializeU256,
	serializeArray,
	deserializeArray,
	serializeByteArray,
	CairoSerde,
} from "../serde/index.js";

// ============ WASM Loader ============

export {
	loadWasmCrypto,
	isWasmAvailable,
	isWasmLoaded,
	getWasmPath,
} from "../wasm-loader/index.js";

import {
	isWasmAvailable,
	isWasmLoaded,
	loadWasmCrypto,
	wasmFeltAdd,
	wasmFeltDiv,
	wasmFeltInverse,
	wasmFeltMul,
	wasmFeltNeg,
	wasmFeltPow,
	wasmFeltSqrt,
	wasmFeltSub,
	wasmGetPublicKey,
	wasmPedersenHash,
	wasmPoseidonHash,
	wasmPoseidonHashMany,
	wasmRecover,
	wasmSign,
	wasmVerify,
} from "../wasm-loader/index.js";

// ============ Helper ============

/**
 * Ensure WASM is loaded, throw helpful error if not
 */
function ensureWasmLoaded(): void {
	if (!isWasmLoaded()) {
		throw new Error("WASM not loaded. Call `await loadWasmCrypto()` first.");
	}
}

// ============ Crypto (WASM-only) ============

/**
 * Native is never available in WASM entrypoint
 */
export function isNativeAvailable(): boolean {
	return false;
}

// Note: isWasmAvailable, isWasmLoaded, loadWasmCrypto already exported above

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

export type { Signature } from "../api-interface.js";

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

// ============ Crypto Namespaces ============

export const Pedersen = {
	hash: pedersenHash,
} as const;

export const Poseidon = {
	hash: poseidonHash,
	hashMany: poseidonHashMany,
} as const;

// Merge Felt primitives with crypto ops (preserve call signature)
import { Felt as FeltPrimitives } from "../primitives/index.js";

const FeltBase = ((value: Parameters<typeof FeltPrimitives>[0]) =>
	FeltPrimitives(value)) as typeof FeltPrimitives;

export const Felt = Object.assign(FeltBase, FeltPrimitives, {
	add: feltAdd,
	sub: feltSub,
	mul: feltMul,
	div: feltDiv,
	neg: feltNeg,
	inverse: feltInverse,
	pow: feltPow,
	sqrt: feltSqrt,
}) as typeof FeltPrimitives & {
	add: typeof feltAdd;
	sub: typeof feltSub;
	mul: typeof feltMul;
	div: typeof feltDiv;
	neg: typeof feltNeg;
	inverse: typeof feltInverse;
	pow: typeof feltPow;
	sqrt: typeof feltSqrt;
};

export const StarkCurve = {
	sign,
	verify,
	getPublicKey,
	recover,
} as const;

// ============ API Parity Check ============

import type { KunderaAPI as _KunderaAPI } from "../api-interface.js";
import {
	Address,
	Class,
	ClassHash,
	ContractAddress,
	EthAddress,
	FIELD_PRIME,
	MAX_ADDRESS,
	MAX_CONTRACT_ADDRESS,
	MAX_ETH_ADDRESS,
	Storage,
	StorageKey,
} from "../primitives/index.js";

import {
	CairoSerde,
	deserializeArray,
	deserializeU256,
	serializeArray,
	serializeByteArray,
	serializeU256,
} from "../serde/index.js";

// Type validator - ensures all exports match _KunderaAPI interface
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _wasmAPI = {
	// Primitives
	FIELD_PRIME,
	MAX_ADDRESS,
	MAX_CONTRACT_ADDRESS,
	MAX_ETH_ADDRESS,
	Felt252,
	ContractAddress,
	ClassHash,
	StorageKey,
	EthAddress,
	Address,
	Class,
	Storage,
	// Crypto
	isNativeAvailable,
	isWasmAvailable,
	isWasmLoaded,
	loadWasmCrypto,
	pedersenHash,
	poseidonHash,
	poseidonHashMany,
	snKeccak,
	feltAdd,
	feltSub,
	feltMul,
	feltDiv,
	feltNeg,
	feltInverse,
	feltPow,
	feltSqrt,
	sign,
	verify,
	getPublicKey,
	recover,
	Pedersen,
	Poseidon,
	Felt,
	StarkCurve,
	// Serde
	serializeU256,
	deserializeU256,
	serializeArray,
	deserializeArray,
	serializeByteArray,
	CairoSerde,
} satisfies _KunderaAPI;

// Explicitly mark as used for type validation
void _wasmAPI;
