import { Felt252 } from "../Felt252/index.js";
import { MAX_STORAGE_KEY } from "./constants.js";

/**
 * Create a StorageKey from Felt252 (with validation)
 * @param {import('../Felt252/types.js').Felt252Input} felt
 * @returns {import('./types.js').StorageKeyType}
 */
export function from(felt) {
	const f = Felt252(felt);
	if (f.toBigInt() >= MAX_STORAGE_KEY) {
		throw new Error("StorageKey must be < 2^251");
	}
	return /** @type {any} */ (f);
}
