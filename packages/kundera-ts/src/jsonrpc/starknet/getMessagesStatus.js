/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getMessagesStatus";

/**
 * @param {string} l1TransactionHash
 * @returns {RequestArguments}
 */
export function GetMessagesStatusRequest(l1TransactionHash) {
	return { method, params: [l1TransactionHash] };
}
