/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getTransactionReceipt";

/**
 * @param {string} transactionHash
 * @returns {{ method: 'starknet_getTransactionReceipt', params: [string] }}
 */
export function GetTransactionReceiptRequest(transactionHash) {
	return { method, params: [transactionHash] };
}
