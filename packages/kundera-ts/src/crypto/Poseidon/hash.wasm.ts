import type { Felt252Type } from "../../primitives/Felt252/types.js";
import type { PoseidonHash } from "./types.js";

let wasmModule: typeof import("../../wasm-loader/index.js") | null = null;

async function ensureLoaded(): Promise<
	typeof import("../../wasm-loader/index.js")
> {
	if (!wasmModule) {
		const loader = await import("../../wasm-loader/index.js");
		await loader.loadWasmCrypto();
		wasmModule = loader;
	}
	return wasmModule;
}

export async function hash(
	a: Felt252Type,
	b: Felt252Type,
): Promise<PoseidonHash> {
	const wasm = await ensureLoaded();
	return wasm.wasmPoseidonHash(a, b);
}

export async function hashMany(values: Felt252Type[]): Promise<PoseidonHash> {
	const wasm = await ensureLoaded();
	return wasm.wasmPoseidonHashMany(values);
}

export function hashSync(a: Felt252Type, b: Felt252Type): PoseidonHash {
	if (!wasmModule)
		throw new Error("WASM not loaded - call ensureLoaded() first");
	return wasmModule.wasmPoseidonHash(a, b);
}

export function hashManySync(values: Felt252Type[]): PoseidonHash {
	if (!wasmModule)
		throw new Error("WASM not loaded - call ensureLoaded() first");
	return wasmModule.wasmPoseidonHashMany(values);
}

export { ensureLoaded };
