/**
 * WASM Loader for Starknet Crypto
 *
 * Loads and manages the WASM crypto module with a minimal WASI shim
 * and bump allocator for memory management.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Felt252, type Felt252Type } from "../primitives/index.js";
import { ErrorCode, type WasmExports, type WasmInstance } from "./types.js";

// ============ Constants ============

/** Default heap start offset (64KB) */
const DEFAULT_HEAP_BASE = 65536;

/** Alignment for allocations */
const ALIGNMENT = 16;

/** Felt252 size in bytes */
const FELT_SIZE = 32;

// ============ State ============

let wasmInstance: WasmInstance | null = null;
let memoryOffset = 0;

// ============ WASI Shim ============

/**
 * Minimal WASI shim - just enough to make the module load.
 * Our FFI doesn't use any WASI functions, but the module expects them.
 */
const wasiShim = {
	// Environment
	environ_get: () => 0,
	environ_sizes_get: (countPtr: number, sizePtr: number) => {
		const view = new DataView(wasmInstance?.memory.buffer);
		view.setUint32(countPtr, 0, true);
		view.setUint32(sizePtr, 0, true);
		return 0;
	},

	// Args
	args_get: () => 0,
	args_sizes_get: (countPtr: number, sizePtr: number) => {
		const view = new DataView(wasmInstance?.memory.buffer);
		view.setUint32(countPtr, 0, true);
		view.setUint32(sizePtr, 0, true);
		return 0;
	},

	// Clock
	clock_time_get: () => 0,

	// FD operations (no-op)
	fd_close: () => 0,
	fd_fdstat_get: () => 0,
	fd_fdstat_set_flags: () => 0,
	fd_prestat_get: () => 8, // EBADF
	fd_prestat_dir_name: () => 8,
	fd_read: () => 0,
	fd_seek: () => 0,
	fd_write: (
		_fd: number,
		_iovs: number,
		_iovsLen: number,
		nwrittenPtr: number,
	) => {
		const view = new DataView(wasmInstance?.memory.buffer);
		view.setUint32(nwrittenPtr, 0, true);
		return 0;
	},

	// Process
	proc_exit: (code: number) => {
		throw new Error(`WASM proc_exit called with code ${code}`);
	},

	// Random (important for crypto!)
	random_get: (bufPtr: number, bufLen: number) => {
		const view = new Uint8Array(wasmInstance?.memory.buffer, bufPtr, bufLen);
		if (typeof crypto !== "undefined" && crypto.getRandomValues) {
			crypto.getRandomValues(view);
		} else {
			// Fallback for environments without Web Crypto
			for (let i = 0; i < bufLen; i++) {
				view[i] = Math.floor(Math.random() * 256);
			}
		}
		return 0;
	},
};

// ============ Memory Management ============

/**
 * Align offset to boundary
 */
function align(offset: number, alignment: number): number {
	return Math.ceil(offset / alignment) * alignment;
}

/**
 * Allocate memory from bump allocator
 */
function malloc(size: number): number {
	const memory = wasmInstance?.memory;
	const aligned = align(memoryOffset, ALIGNMENT);
	const end = aligned + size;

	// Check if we need to grow memory
	const currentBytes = memory.buffer.byteLength;
	if (end > currentBytes) {
		const pagesNeeded = Math.ceil((end - currentBytes) / 65536);
		memory.grow(pagesNeeded);
	}

	memoryOffset = end;
	return aligned;
}

/**
 * Reset allocator (call between operations to reclaim memory)
 */
function resetAllocator(): void {
	if (wasmInstance?.exports.__heap_base) {
		memoryOffset = (
			wasmInstance.exports.__heap_base as unknown as { value: number }
		).value;
	} else {
		memoryOffset = DEFAULT_HEAP_BASE;
	}
}

/**
 * Write Felt252 to WASM memory
 */
function writeFelt(felt: Felt252Type, ptr: number): void {
	const view = new Uint8Array(wasmInstance?.memory.buffer, ptr, FELT_SIZE);
	view.set(felt);
}

/**
 * Read Felt252 from WASM memory
 */
function readFelt(ptr: number): Felt252Type {
	const view = new Uint8Array(wasmInstance?.memory.buffer, ptr, FELT_SIZE);
	return Felt252(new Uint8Array(view));
}

// ============ Error Handling ============

/**
 * Check result code and throw on error
 */
function checkResult(code: number): void {
	switch (code) {
		case ErrorCode.Success:
			return;
		case ErrorCode.InvalidInput:
			throw new Error("Invalid input");
		case ErrorCode.InvalidSignature:
			throw new Error("Invalid signature");
		case ErrorCode.RecoveryFailed:
			throw new Error("Recovery failed");
		case ErrorCode.DivisionByZero:
			throw new Error("Division by zero");
		case ErrorCode.NoInverse:
			throw new Error("No multiplicative inverse");
		case ErrorCode.NoSquareRoot:
			throw new Error("No square root exists");
		default:
			throw new Error(`Unknown error code: ${code}`);
	}
}

// ============ Loading ============

/**
 * Find the WASM file
 */
function findWasmFile(): string | null {
	const fileName = "crypto.wasm";
	const metaPath = (import.meta as { path?: string }).path;
	const moduleDir = metaPath
		? dirname(metaPath)
		: dirname(fileURLToPath(import.meta.url));

	// Search paths
	const searchPaths = [
		// Development: wasm/ directory
		join(process.cwd(), "wasm", fileName),
		// Relative to this module
		join(moduleDir, "..", "..", "wasm", fileName),
		// Installed package
		join(moduleDir, "..", "..", "..", "wasm", fileName),
	];

	for (const path of searchPaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	return null;
}

/**
 * Check if WASM crypto is available
 */
export function isWasmAvailable(): boolean {
	if (wasmInstance !== null) return true;
	return findWasmFile() !== null;
}

/**
 * Get path to WASM file (if found)
 */
export function getWasmPath(): string | null {
	return findWasmFile();
}

/**
 * Load the WASM crypto module
 */
export async function loadWasmCrypto(): Promise<void> {
	if (wasmInstance !== null) return;

	const wasmPath = findWasmFile();
	if (!wasmPath) {
		throw new Error(
			"WASM crypto module not found. Build with: cargo build --release --target wasm32-wasip1",
		);
	}

	const wasmBytes = readFileSync(wasmPath);
	const wasmModule = await WebAssembly.compile(wasmBytes);

	const importObject = {
		wasi_snapshot_preview1: wasiShim,
	};

	const instance = await WebAssembly.instantiate(wasmModule, importObject);
	const exports = instance.exports as unknown as WasmExports;

	wasmInstance = {
		exports,
		memory: exports.memory,
	};

	// Initialize memory offset
	resetAllocator();
}

/**
 * Check if WASM is loaded
 */
export function isWasmLoaded(): boolean {
	return wasmInstance !== null;
}

// ============ Felt Arithmetic ============

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

// ============ Hashing ============

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

// ============ ECDSA ============

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

export interface WasmSignature {
	r: Felt252Type;
	s: Felt252Type;
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
