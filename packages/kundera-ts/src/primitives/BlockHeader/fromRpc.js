import { fromHex as feltFromHex } from "../Felt252/fromHex.js";
import { fromHex as addressFromHex } from "../ContractAddress/fromHex.js";

/**
 * @param {{ price_in_fri: string, price_in_wei: string }} rpc
 * @returns {import('./types.js').ResourcePriceType}
 */
export function resourcePriceFromRpc(rpc) {
	return {
		price_in_fri: feltFromHex(rpc.price_in_fri),
		price_in_wei: feltFromHex(rpc.price_in_wei),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').BlockHeader} rpc
 * @returns {import('./types.js').BlockHeaderType}
 */
export function blockHeaderFromRpc(rpc) {
	return {
		block_hash: feltFromHex(rpc.block_hash),
		parent_hash: feltFromHex(rpc.parent_hash),
		block_number: rpc.block_number,
		new_root: feltFromHex(rpc.new_root),
		timestamp: rpc.timestamp,
		sequencer_address: addressFromHex(rpc.sequencer_address),
		l1_gas_price: resourcePriceFromRpc(rpc.l1_gas_price),
		l2_gas_price: resourcePriceFromRpc(rpc.l2_gas_price),
		l1_data_gas_price: resourcePriceFromRpc(rpc.l1_data_gas_price),
		l1_da_mode: rpc.l1_da_mode,
		starknet_version: rpc.starknet_version,
	};
}

/**
 * @param {import('../../jsonrpc/types.js').BlockHeaderWithCommitments} rpc
 * @returns {import('./types.js').BlockHeaderWithCommitmentsType}
 */
export function blockHeaderWithCommitmentsFromRpc(rpc) {
	return {
		...blockHeaderFromRpc(rpc),
		event_commitment: feltFromHex(rpc.event_commitment),
		transaction_commitment: feltFromHex(rpc.transaction_commitment),
		receipt_commitment: feltFromHex(rpc.receipt_commitment),
		state_diff_commitment: feltFromHex(rpc.state_diff_commitment),
		event_count: rpc.event_count,
		transaction_count: rpc.transaction_count,
		state_diff_length: rpc.state_diff_length,
	};
}
