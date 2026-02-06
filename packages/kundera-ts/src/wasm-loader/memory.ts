/**
 * WASM Memory Management
 *
 * Bump allocator and memory utilities for WASM.
 */

import { Felt252, type Felt252Type } from "../primitives/index.js";
import { ErrorCode } from "./types.js";
import {
	wasmInstance,
	memoryOffset,
	setMemoryOffset,
	DEFAULT_HEAP_BASE,
	ALIGNMENT,
	FELT_SIZE,
} from "./state.js";

/**
 * Align offset to boundary
 */
export function align(offset: number, alignment: number): number {
	return Math.ceil(offset / alignment) * alignment;
}

/**
 * Allocate memory from bump allocator
 */
export function malloc(size: number): number {
	const memory = wasmInstance!.memory;
	const aligned = align(memoryOffset, ALIGNMENT);
	const end = aligned + size;

	// Check if we need to grow memory
	const currentBytes = memory.buffer.byteLength;
	if (end > currentBytes) {
		const pagesNeeded = Math.ceil((end - currentBytes) / 65536);
		memory.grow(pagesNeeded);
	}

	setMemoryOffset(end);
	return aligned;
}

/**
 * Reset allocator (call between operations to reclaim memory)
 */
export function resetAllocator(): void {
	if (wasmInstance?.exports.__heap_base) {
		setMemoryOffset(
			(wasmInstance.exports.__heap_base as unknown as { value: number }).value,
		);
	} else {
		setMemoryOffset(DEFAULT_HEAP_BASE);
	}
}

/**
 * Write Felt252 to WASM memory
 */
export function writeFelt(felt: Felt252Type, ptr: number): void {
	const view = new Uint8Array(wasmInstance!.memory.buffer, ptr, FELT_SIZE);
	view.set(felt);
}

/**
 * Read Felt252 from WASM memory
 */
export function readFelt(ptr: number): Felt252Type {
	const view = new Uint8Array(wasmInstance!.memory.buffer, ptr, FELT_SIZE);
	return Felt252(new Uint8Array(view));
}

/**
 * Check result code and throw on error
 */
export function checkResult(code: number): void {
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
