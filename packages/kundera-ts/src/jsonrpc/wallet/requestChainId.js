/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_requestChainId";

/**
 * @returns {{ method: 'wallet_requestChainId', params: [] }}
 */
export function RequestChainIdRequest() {
	return { method, params: [] };
}
