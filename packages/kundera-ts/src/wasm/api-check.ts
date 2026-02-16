/**
 * WASM API Parity Check
 *
 * Compile-time validation that WASM entrypoint exports match KunderaAPI interface.
 * This file is not imported at runtime - it only exists for type checking.
 */

import type { KunderaAPI as _KunderaAPI } from "../api-interface.js";
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
} from "../primitives/index.js";

import {
	CairoSerde,
	deserializeArray,
	deserializeU256,
	serializeArray,
	serializeByteArray,
	serializeU256,
} from "../serde/index.js";

import {
	isWasmAvailable,
	isWasmLoaded,
	loadWasmCrypto,
} from "../wasm-loader/index.js";

import {
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
	pedersenHash,
	poseidonHash,
	poseidonHashMany,
	recover,
	sign,
	snKeccak,
	verify,
} from "./crypto.js";

import { Felt, Pedersen, Poseidon, StarkCurve } from "./namespaces/index.js";

// Type validator - ensures all exports match _KunderaAPI interface
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
	Felt,
	Address,
	Class,
	Storage,
	// Serde
	serializeU256,
	deserializeU256,
	serializeArray,
	deserializeArray,
	serializeByteArray,
	CairoSerde,
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
	StarkCurve,
} satisfies _KunderaAPI;

// Use the validator to ensure we don't miss exports
void _wasmAPI;
