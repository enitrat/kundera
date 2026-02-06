/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getTransactionByHash";

/**
 * @param {string} transactionHash
 * @returns {{ method: 'starknet_getTransactionByHash', params: [string] }}
 */
export function GetTransactionByHashRequest(transactionHash) {
	return { method, params: [transactionHash] };
}
