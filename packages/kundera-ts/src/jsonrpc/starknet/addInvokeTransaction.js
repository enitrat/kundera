/** @typedef {import('../types.js').BroadcastedInvokeTxn} BroadcastedInvokeTxn */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_addInvokeTransaction";

/**
 * @param {BroadcastedInvokeTxn} transaction
 * @returns {{ method: 'starknet_addInvokeTransaction', params: [BroadcastedInvokeTxn] }}
 */
export function AddInvokeTransactionRequest(transaction) {
	return { method, params: [transaction] };
}
