/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_chainId";

/**
 * @returns {{ method: 'starknet_chainId', params: [] }}
 */
export function ChainIdRequest() {
	return { method, params: [] };
}
