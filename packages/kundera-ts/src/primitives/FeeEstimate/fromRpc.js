import { fromHex as feltFromHex } from "../Felt252/fromHex.js";

/**
 * @param {import('../../jsonrpc/types.js').FeeEstimate} rpc
 * @returns {import('./types.js').FeeEstimateType}
 */
export function feeEstimateFromRpc(rpc) {
	return {
		gas_consumed: feltFromHex(rpc.gas_consumed),
		gas_price: feltFromHex(rpc.gas_price),
		data_gas_consumed: feltFromHex(rpc.data_gas_consumed),
		data_gas_price: feltFromHex(rpc.data_gas_price),
		overall_fee: feltFromHex(rpc.overall_fee),
		unit: rpc.unit,
	};
}
