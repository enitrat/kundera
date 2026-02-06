/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getTransactionStatus";

/**
 * @param {string} transactionHash
 * @returns {RequestArguments}
 */
export function GetTransactionStatusRequest(transactionHash) {
	return { method, params: [transactionHash] };
}
