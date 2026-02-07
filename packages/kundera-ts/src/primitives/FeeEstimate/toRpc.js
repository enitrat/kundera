/**
 * @param {import('./types.js').FeeEstimateType} fee
 * @returns {import('../../jsonrpc/types.js').FeeEstimate}
 */
export function feeEstimateToRpc(fee) {
	return {
		l1_gas_consumed: fee.l1_gas_consumed.toHex(),
		l1_gas_price: fee.l1_gas_price.toHex(),
		l2_gas_consumed: fee.l2_gas_consumed.toHex(),
		l2_gas_price: fee.l2_gas_price.toHex(),
		l1_data_gas_consumed: fee.l1_data_gas_consumed.toHex(),
		l1_data_gas_price: fee.l1_data_gas_price.toHex(),
		overall_fee: fee.overall_fee.toHex(),
		unit: fee.unit,
	};
}
