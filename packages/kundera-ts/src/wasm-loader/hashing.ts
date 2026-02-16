/**
 * WASM Hashing
 *
 * Cryptographic hash functions via WASM.
 */

import type { Felt252Type } from "../primitives/index.js";
import {
	checkResult,
	malloc,
	readFelt,
	resetAllocator,
	writeFelt,
} from "./memory.js";
import { FELT_SIZE, wasmInstance } from "./state.js";

export function wasmPedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrB = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);
	writeFelt(b, ptrB);

	const result = wasmInstance.exports.starknet_pedersen_hash(
		ptrA,
		ptrB,
		ptrOut,
	);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmPoseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrB = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);
	writeFelt(b, ptrB);

	const result = wasmInstance.exports.starknet_poseidon_hash(
		ptrA,
		ptrB,
		ptrOut,
	);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmPoseidonHashMany(inputs: Felt252Type[]): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	// Pack inputs into contiguous buffer
	const ptrInputs = malloc(inputs.length * FELT_SIZE);
	for (const [i, input] of inputs.entries()) {
		writeFelt(input, ptrInputs + i * FELT_SIZE);
	}

	const ptrOut = malloc(FELT_SIZE);

	const result = wasmInstance.exports.starknet_poseidon_hash_many(
		ptrInputs,
		inputs.length,
		ptrOut,
	);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmKeccak256(data: Uint8Array): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	// Allocate and write input data
	const ptrData = malloc(data.length);
	const view = new Uint8Array(wasmInstance.memory.buffer, ptrData, data.length);
	view.set(data);

	const ptrOut = malloc(FELT_SIZE);

	const result = wasmInstance.exports.starknet_keccak256(
		ptrData,
		data.length,
		ptrOut,
	);
	checkResult(result);

	return readFelt(ptrOut);
}
