import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import { MAX_STORAGE_KEY } from "./constants.js";

/**
 * Create StorageKey from hex string
 * @param {string} hex
 * @returns {import('./types.js').StorageKeyType}
 */
export function fromHex(hex) {
	const f = feltFromHex(hex);
	if (f.toBigInt() >= MAX_STORAGE_KEY) {
		throw new Error("StorageKey must be < 2^251");
	}
	return /** @type {any} */ (f);
}
