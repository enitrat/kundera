/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_specVersion";

/**
 * @returns {RequestArguments}
 */
export function SpecVersionRequest() {
	return { method, params: [] };
}
