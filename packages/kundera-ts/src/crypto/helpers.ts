/**
 * Crypto Helper Utilities
 */

import { getNative, getWasm } from "./state.js";

/**
 * Error thrown when crypto operations are attempted without initialization
 */
export class CryptoNotInitializedError extends Error {
	constructor() {
		super(
			"Crypto backend not initialized - call loadWasmCrypto() first or use Bun runtime",
		);
		this.name = "CryptoNotInitializedError";
	}
}

/**
 * Higher-order function that handles native/wasm fallback pattern.
 * Tries native implementation first, falls back to wasm, throws if neither available.
 *
 * @example
 * export const feltAdd = withCrypto({
 *   native: (n, a, b) => Felt252(n.feltAdd(a, b)),
 *   wasm: (w, a, b) => Felt252(w.wasmFeltAdd(a, b))
 * });
 */
export function withCrypto<Args extends unknown[], R>(operation: {
	native: (impl: NonNullable<ReturnType<typeof getNative>>, ...args: Args) => R;
	wasm: (impl: NonNullable<ReturnType<typeof getWasm>>, ...args: Args) => R;
}): (...args: Args) => R {
	return (...args: Args) => {
		const n = getNative();
		if (n) return operation.native(n, ...args);

		const w = getWasm();
		if (w) return operation.wasm(w, ...args);

		throw new CryptoNotInitializedError();
	};
}
