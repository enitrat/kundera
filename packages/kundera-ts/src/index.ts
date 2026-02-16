/**
 * Kundera - Starknet Primitives Library
 *
 * A high-performance library for Starknet types and cryptography.
 * Architecture: TypeScript API → Rust FFI (starknet-crypto)
 *
 * @packageDocumentation
 */

import type { KunderaAPI } from "./api-interface.js";

// Re-export all primitives (base types)
export * from "./primitives/index.js";

// Re-export crypto (includes merged Felt namespace with arithmetic)
// Note: This shadows the Felt from primitives with an extended version
export {
	// Availability checks
	isNativeAvailable,
	isWasmAvailable,
	isWasmLoaded,
	loadWasmCrypto,
	// Hashing
	pedersenHash,
	poseidonHash,
	poseidonHashMany,
	snKeccak,
	// Felt arithmetic
	feltAdd,
	feltSub,
	feltMul,
	feltDiv,
	feltNeg,
	feltInverse,
	feltPow,
	feltSqrt,
	// ECDSA
	sign,
	verify,
	getPublicKey,
	recover,
	// Namespaces
	Pedersen,
	Poseidon,
	Felt,
	StarkCurve,
	// Types
	type Signature,
} from "./crypto/index.js";

// Re-export serde
export * from "./serde/index.js";

// ============ API Parity Check ============

import {
	Address,
	Class,
	ClassHash,
	ContractAddress,
	EthAddress,
	FIELD_PRIME,
	Felt252,
	MAX_ADDRESS,
	MAX_CONTRACT_ADDRESS,
	MAX_ETH_ADDRESS,
	Storage,
	StorageKey,
} from "./primitives/index.js";

import {
	Felt as CryptoFelt,
	Pedersen,
	Poseidon,
	StarkCurve,
	feltAdd,
	feltDiv,
	feltInverse,
	feltMul,
	feltNeg,
	feltPow,
	feltSqrt,
	feltSub,
	getPublicKey,
	isNativeAvailable,
	isWasmAvailable,
	isWasmLoaded,
	loadWasmCrypto,
	pedersenHash,
	poseidonHash,
	poseidonHashMany,
	recover,
	sign,
	snKeccak,
	verify,
} from "./crypto/index.js";

import {
	CairoSerde,
	deserializeArray,
	deserializeU256,
	serializeArray,
	serializeByteArray,
	serializeU256,
} from "./serde/index.js";

// Type validator - ensures all exports match KunderaAPI interface
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _api = {
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
	Felt: CryptoFelt,
	StarkCurve,
	// Serde
	serializeU256,
	deserializeU256,
	serializeArray,
	deserializeArray,
	serializeByteArray,
	CairoSerde,
} satisfies KunderaAPI;

// Explicitly mark as used for type validation
void _api;
