/**
 * WASM Felt Arithmetic
 *
 * Felt field arithmetic operations via WASM.
 */

import type { Felt252Type } from "../primitives/index.js";
import { wasmInstance, FELT_SIZE } from "./state.js";
import {
	malloc,
	resetAllocator,
	writeFelt,
	readFelt,
	checkResult,
} from "./memory.js";

export function wasmFeltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrB = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);
	writeFelt(b, ptrB);

	const result = wasmInstance.exports.felt_add(ptrA, ptrB, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmFeltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrB = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);
	writeFelt(b, ptrB);

	const result = wasmInstance.exports.felt_sub(ptrA, ptrB, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmFeltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrB = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);
	writeFelt(b, ptrB);

	const result = wasmInstance.exports.felt_mul(ptrA, ptrB, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmFeltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrB = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);
	writeFelt(b, ptrB);

	const result = wasmInstance.exports.felt_div(ptrA, ptrB, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmFeltNeg(a: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);

	const result = wasmInstance.exports.felt_neg(ptrA, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmFeltInverse(a: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);

	const result = wasmInstance.exports.felt_inverse(ptrA, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmFeltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrBase = malloc(FELT_SIZE);
	const ptrExp = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(base, ptrBase);
	writeFelt(exp, ptrExp);

	const result = wasmInstance.exports.felt_pow(ptrBase, ptrExp, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmFeltSqrt(a: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrA = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(a, ptrA);

	const result = wasmInstance.exports.felt_sqrt(ptrA, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}
