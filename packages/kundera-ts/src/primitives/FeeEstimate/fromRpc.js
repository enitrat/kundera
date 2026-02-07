import { fromHex as feltFromHex } from "../Felt252/fromHex.js";

/**
 * @param {import('../../jsonrpc/types.js').FeeEstimate} rpc
 * @returns {import('./types.js').FeeEstimateType}
 */
export function feeEstimateFromRpc(rpc) {
	return {
		l1_gas_consumed: feltFromHex(rpc.l1_gas_consumed),
		l1_gas_price: feltFromHex(rpc.l1_gas_price),
		l2_gas_consumed: feltFromHex(rpc.l2_gas_consumed),
		l2_gas_price: feltFromHex(rpc.l2_gas_price),
		l1_data_gas_consumed: feltFromHex(rpc.l1_data_gas_consumed),
		l1_data_gas_price: feltFromHex(rpc.l1_data_gas_price),
		overall_fee: feltFromHex(rpc.overall_fee),
		unit: rpc.unit,
	};
}
