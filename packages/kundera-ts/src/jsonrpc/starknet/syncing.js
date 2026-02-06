/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_syncing";

/**
 * @returns {{ method: 'starknet_syncing', params: [] }}
 */
export function SyncingRequest() {
	return { method, params: [] };
}
