/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../types.js').BroadcastedTxn} BroadcastedTxn */
/** @typedef {import('../types.js').SimulationFlag} SimulationFlag */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_estimateFee";

/**
 * @param {BroadcastedTxn[]} transactions
 * @param {SimulationFlag[]} [simulationFlags=[]]
 * @param {BlockId} [blockId='latest']
 * @returns {RequestArguments}
 */
export function EstimateFeeRequest(
	transactions,
	simulationFlags = [],
	blockId = "latest",
) {
	return { method, params: [transactions, simulationFlags, blockId] };
}
