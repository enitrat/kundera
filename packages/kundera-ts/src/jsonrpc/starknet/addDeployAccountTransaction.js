/** @typedef {import('../types.js').BroadcastedDeployAccountTxn} BroadcastedDeployAccountTxn */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_addDeployAccountTransaction";

/**
 * @param {BroadcastedDeployAccountTxn} transaction
 * @returns {{ method: 'starknet_addDeployAccountTransaction', params: [BroadcastedDeployAccountTxn] }}
 */
export function AddDeployAccountTransactionRequest(transaction) {
	return { method, params: [transaction] };
}
