/**
 * WASM Loader State
 *
 * Global state for the WASM crypto module.
 */

import type { WasmInstance } from './types.js';

/** Default heap start offset (64KB) */
export const DEFAULT_HEAP_BASE = 65536;

/** Alignment for allocations */
export const ALIGNMENT = 16;

/** Felt252 size in bytes */
export const FELT_SIZE = 32;

/** Global WASM instance */
export let wasmInstance: WasmInstance | null = null;

/** Current memory allocation offset */
export let memoryOffset = 0;

/**
 * Set the WASM instance
 */
export function setWasmInstance(instance: WasmInstance | null): void {
  wasmInstance = instance;
}

/**
 * Set the memory offset
 */
export function setMemoryOffset(offset: number): void {
  memoryOffset = offset;
}
