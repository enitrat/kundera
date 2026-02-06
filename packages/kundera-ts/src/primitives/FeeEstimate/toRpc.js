/**
 * @param {import('./types.js').FeeEstimateType} fee
 * @returns {import('../../jsonrpc/types.js').FeeEstimate}
 */
export function feeEstimateToRpc(fee) {
	return {
		gas_consumed: fee.gas_consumed.toHex(),
		gas_price: fee.gas_price.toHex(),
		data_gas_consumed: fee.data_gas_consumed.toHex(),
		data_gas_price: fee.data_gas_price.toHex(),
		overall_fee: fee.overall_fee.toHex(),
		unit: fee.unit,
	};
}
