/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_subscribeTransactionStatus";

/**
 * @param {string} transactionHash
 * @returns {{ method: 'starknet_subscribeTransactionStatus', params: [string] }}
 */
export function SubscribeTransactionStatusRequest(transactionHash) {
	return { method, params: [transactionHash] };
}
