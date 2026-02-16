/**
 * Kundera API Interface
 *
 * Defines the compile-time API contract that all entrypoints must satisfy.
 * Use `satisfies KunderaAPI` in index.ts, native/index.ts, wasm/index.ts.
 */

import type {
	ClassHashType,
	ContractAddressType,
	EthAddressType,
	Felt252Input,
	Felt252Type,
	StorageKeyType,
} from "./primitives/index.js";

export interface FeltConstructor {
	(value: Felt252Input): Felt252Type;
	from: (value: Felt252Input) => Felt252Type;
	fromHex: (hex: string) => Felt252Type;
	fromBigInt: (value: bigint) => Felt252Type;
	fromBytes: (bytes: Uint8Array) => Felt252Type;
	isValid: (felt: Felt252Type) => boolean;
	isZero: (felt: Felt252Type) => boolean;
	equals: (a: Felt252Type, b: Felt252Type) => boolean;
	toHex: (felt: Felt252Type) => string;
	toBigInt: (felt: Felt252Type) => bigint;
	encodeShortString: (str: string) => Felt252Type;
	encodeShortStringHex: (str: string) => string;
	decodeShortString: (felt: bigint | string | Felt252Type) => string;
	ZERO: Felt252Type;
	ONE: Felt252Type;
	TWO: Felt252Type;
	PRIME: bigint;
	MAX_SHORT_STRING_LENGTH: number;
}

// ============ Primitives API ============

export interface PrimitivesAPI {
	// Constants
	FIELD_PRIME: bigint;
	MAX_ADDRESS: bigint;
	MAX_CONTRACT_ADDRESS: bigint;
	MAX_ETH_ADDRESS: bigint;

	// Felt252 constructor + static helpers
	Felt252: FeltConstructor;

	// Address constructors
	ContractAddress: (value: Felt252Input) => ContractAddressType;

	// Class hash
	ClassHash: (value: Felt252Input) => ClassHashType;

	// Storage key
	StorageKey: (value: Felt252Input) => StorageKeyType;

	// Eth address
	EthAddress: (value: Felt252Input) => EthAddressType;

	// Namespaces
	Felt: FeltConstructor;

	Address: {
		from: (value: Felt252Input) => ContractAddressType;
		isValid: (felt: Felt252Input) => boolean;
		MAX: bigint;
	};

	Class: {
		from: (value: Felt252Input) => ClassHashType;
	};

	Storage: {
		from: (value: Felt252Input) => StorageKeyType;
	};
}

// ============ Crypto API ============

export interface Signature {
	r: Felt252Type;
	s: Felt252Type;
}

export interface CryptoAPI {
	// Availability
	isNativeAvailable: () => boolean;
	isWasmAvailable: () => boolean;
	isWasmLoaded: () => boolean;
	loadWasmCrypto: () => Promise<void>;

	// Hashing
	pedersenHash: (a: Felt252Type, b: Felt252Type) => Felt252Type;
	poseidonHash: (a: Felt252Type, b: Felt252Type) => Felt252Type;
	poseidonHashMany: (inputs: Felt252Type[]) => Felt252Type;
	snKeccak: (data: Uint8Array) => Felt252Type;

	// Felt arithmetic
	feltAdd: (a: Felt252Type, b: Felt252Type) => Felt252Type;
	feltSub: (a: Felt252Type, b: Felt252Type) => Felt252Type;
	feltMul: (a: Felt252Type, b: Felt252Type) => Felt252Type;
	feltDiv: (a: Felt252Type, b: Felt252Type) => Felt252Type;
	feltNeg: (a: Felt252Type) => Felt252Type;
	feltInverse: (a: Felt252Type) => Felt252Type;
	feltPow: (base: Felt252Type, exp: Felt252Type) => Felt252Type;
	feltSqrt: (a: Felt252Type) => Felt252Type;

	// ECDSA
	sign: (privateKey: Felt252Type, messageHash: Felt252Type) => Signature;
	verify: (
		publicKey: Felt252Type,
		messageHash: Felt252Type,
		signature: Signature,
	) => boolean;
	getPublicKey: (privateKey: Felt252Type) => Felt252Type;
	recover: (
		messageHash: Felt252Type,
		r: Felt252Type,
		s: Felt252Type,
		v: Felt252Type,
	) => Felt252Type;

	// Namespaces
	Pedersen: { hash: (a: Felt252Type, b: Felt252Type) => Felt252Type };
	Poseidon: {
		hash: (a: Felt252Type, b: Felt252Type) => Felt252Type;
		hashMany: (inputs: Felt252Type[]) => Felt252Type;
	};
	Felt: {
		add: (a: Felt252Type, b: Felt252Type) => Felt252Type;
		sub: (a: Felt252Type, b: Felt252Type) => Felt252Type;
		mul: (a: Felt252Type, b: Felt252Type) => Felt252Type;
		div: (a: Felt252Type, b: Felt252Type) => Felt252Type;
		neg: (a: Felt252Type) => Felt252Type;
		inverse: (a: Felt252Type) => Felt252Type;
		pow: (base: Felt252Type, exp: Felt252Type) => Felt252Type;
		sqrt: (a: Felt252Type) => Felt252Type;
	};
	StarkCurve: {
		sign: (privateKey: Felt252Type, messageHash: Felt252Type) => Signature;
		verify: (
			publicKey: Felt252Type,
			messageHash: Felt252Type,
			signature: Signature,
		) => boolean;
		getPublicKey: (privateKey: Felt252Type) => Felt252Type;
		recover: (
			messageHash: Felt252Type,
			r: Felt252Type,
			s: Felt252Type,
			v: Felt252Type,
		) => Felt252Type;
	};
}

// ============ Serde API ============

export interface SerdeAPI {
	serializeU256: (value: bigint) => [Felt252Type, Felt252Type];
	deserializeU256: (felts: [Felt252Type, Felt252Type]) => bigint;
	serializeArray: (felts: Felt252Type[]) => Felt252Type[];
	deserializeArray: (
		felts: Felt252Type[],
		offset?: number,
	) => { array: Felt252Type[]; nextOffset: number };
	serializeByteArray: (data: Uint8Array) => Felt252Type[];

	CairoSerde: {
		serializeU256: (value: bigint) => [Felt252Type, Felt252Type];
		deserializeU256: (felts: [Felt252Type, Felt252Type]) => bigint;
		serializeArray: (felts: Felt252Type[]) => Felt252Type[];
		deserializeArray: (
			felts: Felt252Type[],
			offset?: number,
		) => { array: Felt252Type[]; nextOffset: number };
		serializeByteArray: (data: Uint8Array) => Felt252Type[];
	};
}

// ============ Combined API ============

/**
 * Full Kundera API interface
 *
 * All entrypoints (index, native, wasm) must satisfy this interface.
 */
export type KunderaAPI = PrimitivesAPI & CryptoAPI & SerdeAPI;
