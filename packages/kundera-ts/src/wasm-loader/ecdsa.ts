/**
 * WASM ECDSA
 *
 * ECDSA operations on the Stark curve via WASM.
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
import { ErrorCode } from "./types.js";

export interface WasmSignature {
	r: Felt252Type;
	s: Felt252Type;
}

export function wasmGetPublicKey(privateKey: Felt252Type): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrPriv = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(privateKey, ptrPriv);

	const result = wasmInstance.exports.starknet_get_public_key(ptrPriv, ptrOut);
	checkResult(result);

	return readFelt(ptrOut);
}

export function wasmSign(
	privateKey: Felt252Type,
	messageHash: Felt252Type,
): WasmSignature {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrPriv = malloc(FELT_SIZE);
	const ptrMsg = malloc(FELT_SIZE);
	const ptrR = malloc(FELT_SIZE);
	const ptrS = malloc(FELT_SIZE);

	writeFelt(privateKey, ptrPriv);
	writeFelt(messageHash, ptrMsg);

	const result = wasmInstance.exports.starknet_sign(
		ptrPriv,
		ptrMsg,
		ptrR,
		ptrS,
	);
	checkResult(result);

	return {
		r: readFelt(ptrR),
		s: readFelt(ptrS),
	};
}

export function wasmVerify(
	publicKey: Felt252Type,
	messageHash: Felt252Type,
	r: Felt252Type,
	s: Felt252Type,
): boolean {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrPub = malloc(FELT_SIZE);
	const ptrMsg = malloc(FELT_SIZE);
	const ptrR = malloc(FELT_SIZE);
	const ptrS = malloc(FELT_SIZE);

	writeFelt(publicKey, ptrPub);
	writeFelt(messageHash, ptrMsg);
	writeFelt(r, ptrR);
	writeFelt(s, ptrS);

	const result = wasmInstance.exports.starknet_verify(
		ptrPub,
		ptrMsg,
		ptrR,
		ptrS,
	);

	if (result === ErrorCode.Success) return true;
	if (result === ErrorCode.InvalidSignature) return false;
	checkResult(result);
	return false;
}

export function wasmRecover(
	messageHash: Felt252Type,
	r: Felt252Type,
	s: Felt252Type,
	v: Felt252Type,
): Felt252Type {
	if (!wasmInstance) throw new Error("WASM not loaded");
	resetAllocator();

	const ptrMsg = malloc(FELT_SIZE);
	const ptrR = malloc(FELT_SIZE);
	const ptrS = malloc(FELT_SIZE);
	const ptrV = malloc(FELT_SIZE);
	const ptrOut = malloc(FELT_SIZE);

	writeFelt(messageHash, ptrMsg);
	writeFelt(r, ptrR);
	writeFelt(s, ptrS);
	writeFelt(v, ptrV);

	const result = wasmInstance.exports.starknet_recover(
		ptrMsg,
		ptrR,
		ptrS,
		ptrV,
		ptrOut,
	);
	checkResult(result);

	return readFelt(ptrOut);
}
