/**
 * API Parity Check
 *
 * Compile-time validation that main entrypoint exports match KunderaAPI interface.
 * This file is not imported at runtime - it only exists for type checking.
 */

import type { KunderaAPI } from "./api-interface.js";

import {
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
} from "./primitives/index.js";

import {
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
} from "./crypto/index.js";

import {
	serializeU256,
	deserializeU256,
	serializeArray,
	deserializeArray,
	serializeByteArray,
	CairoSerde,
} from "./serde/index.js";

// Type validator - ensures all exports match KunderaAPI interface
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
	Felt,
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
