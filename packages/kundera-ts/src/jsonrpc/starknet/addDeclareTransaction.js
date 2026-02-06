/** @typedef {import('../types.js').BroadcastedDeclareTxn} BroadcastedDeclareTxn */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_addDeclareTransaction";

/**
 * @param {BroadcastedDeclareTxn} transaction
 * @returns {RequestArguments}
 */
export function AddDeclareTransactionRequest(transaction) {
	return { method, params: [transaction] };
}
