/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_traceTransaction";

/**
 * @param {string} transactionHash
 * @returns {{ method: 'starknet_traceTransaction', params: [string] }}
 */
export function TraceTransactionRequest(transactionHash) {
	return { method, params: [transactionHash] };
}
