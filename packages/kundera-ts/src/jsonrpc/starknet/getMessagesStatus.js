/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getMessagesStatus";

/**
 * @param {string} l1TransactionHash
 * @returns {{ method: 'starknet_getMessagesStatus', params: [string] }}
 */
export function GetMessagesStatusRequest(l1TransactionHash) {
	return { method, params: [l1TransactionHash] };
}
