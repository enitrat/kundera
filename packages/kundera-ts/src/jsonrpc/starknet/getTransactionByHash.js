/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getTransactionByHash";

/**
 * @param {string} transactionHash
 * @returns {RequestArguments}
 */
export function GetTransactionByHashRequest(transactionHash) {
	return { method, params: [transactionHash] };
}
