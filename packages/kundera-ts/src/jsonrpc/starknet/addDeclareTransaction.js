/** @typedef {import('../types.js').BroadcastedDeclareTxn} BroadcastedDeclareTxn */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_addDeclareTransaction";

/**
 * @param {BroadcastedDeclareTxn} transaction
 * @returns {{ method: 'starknet_addDeclareTransaction', params: [BroadcastedDeclareTxn] }}
 */
export function AddDeclareTransactionRequest(transaction) {
	return { method, params: [transaction] };
}
