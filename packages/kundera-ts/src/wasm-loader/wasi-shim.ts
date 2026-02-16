/**
 * WASI Shim
 *
 * Minimal WASI shim for the WASM crypto module.
 */

import { wasmInstance } from "./state.js";

/**
 * Get the WASI shim import object
 */
export function getWasiShim() {
	return {
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
}
