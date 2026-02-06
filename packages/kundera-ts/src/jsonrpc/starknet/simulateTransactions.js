/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../types.js').BroadcastedTxn} BroadcastedTxn */
/** @typedef {import('../types.js').SimulationFlag} SimulationFlag */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_simulateTransactions";

/**
 * @param {BlockId} blockId
 * @param {BroadcastedTxn[]} transactions
 * @param {SimulationFlag[]} [simulationFlags=[]]
 * @returns {{ method: 'starknet_simulateTransactions', params: [BlockId, BroadcastedTxn[], SimulationFlag[]] }}
 */
export function SimulateTransactionsRequest(
	blockId,
	transactions,
	simulationFlags = [],
) {
	return { method, params: [blockId, transactions, simulationFlags] };
}
