/**
 * WASM Loading
 *
 * Functions for loading the WASM crypto module.
 */

import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WasmExports } from "./types.js";
import { wasmInstance, setWasmInstance } from "./state.js";
import { getWasiShim } from "./wasi-shim.js";
import { resetAllocator } from "./memory.js";

/**
 * Find the WASM file
 */
export function findWasmFile(): string | null {
	const fileName = "crypto.wasm";
	const moduleDir = dirname(fileURLToPath(import.meta.url));

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
		wasi_snapshot_preview1: getWasiShim(),
	};

	const instance = await WebAssembly.instantiate(wasmModule, importObject);
	const exports = instance.exports as unknown as WasmExports;

	setWasmInstance({
		exports,
		memory: exports.memory,
	});

	// Initialize memory offset
	resetAllocator();
}

/**
 * Check if WASM is loaded
 */
export function isWasmLoaded(): boolean {
	return wasmInstance !== null;
}
