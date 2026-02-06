/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_blockNumber";

/**
 * @returns {{ method: 'starknet_blockNumber', params: [] }}
 */
export function BlockNumberRequest() {
	return { method, params: [] };
}
