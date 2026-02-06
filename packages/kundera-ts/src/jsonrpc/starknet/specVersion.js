/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_specVersion";

/**
 * @returns {{ method: 'starknet_specVersion', params: [] }}
 */
export function SpecVersionRequest() {
	return { method, params: [] };
}
