import { hexToFelt, feltToHex } from './helpers.js';

/**
 * @param {import('../types.js').FeeEstimate} rpc
 * @returns {import('../rich.js').RichFeeEstimate}
 */
export function feeEstimateFromRpc(rpc) {
  return {
    gas_consumed: hexToFelt(rpc.gas_consumed),
    gas_price: hexToFelt(rpc.gas_price),
    data_gas_consumed: hexToFelt(rpc.data_gas_consumed),
    data_gas_price: hexToFelt(rpc.data_gas_price),
    overall_fee: hexToFelt(rpc.overall_fee),
    unit: rpc.unit,
  };
}

/**
 * @param {import('../rich.js').RichFeeEstimate} rich
 * @returns {import('../types.js').FeeEstimate}
 */
export function feeEstimateToRpc(rich) {
  return {
    gas_consumed: feltToHex(rich.gas_consumed),
    gas_price: feltToHex(rich.gas_price),
    data_gas_consumed: feltToHex(rich.data_gas_consumed),
    data_gas_price: feltToHex(rich.data_gas_price),
    overall_fee: feltToHex(rich.overall_fee),
    unit: rich.unit,
  };
}
