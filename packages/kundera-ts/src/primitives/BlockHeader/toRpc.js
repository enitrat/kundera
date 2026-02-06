/**
 * @param {import('./types.js').ResourcePriceType} price
 * @returns {{ price_in_fri: string, price_in_wei: string }}
 */
export function resourcePriceToRpc(price) {
	return {
		price_in_fri: price.price_in_fri.toHex(),
		price_in_wei: price.price_in_wei.toHex(),
	};
}

/**
 * @param {import('./types.js').BlockHeaderType} header
 * @returns {import('../../jsonrpc/types.js').BlockHeader}
 */
export function blockHeaderToRpc(header) {
	return {
		block_hash: header.block_hash.toHex(),
		parent_hash: header.parent_hash.toHex(),
		block_number: header.block_number,
		new_root: header.new_root.toHex(),
		timestamp: header.timestamp,
		sequencer_address: header.sequencer_address.toHex(),
		l1_gas_price: resourcePriceToRpc(header.l1_gas_price),
		l2_gas_price: resourcePriceToRpc(header.l2_gas_price),
		l1_data_gas_price: resourcePriceToRpc(header.l1_data_gas_price),
		l1_da_mode: header.l1_da_mode,
		starknet_version: header.starknet_version,
	};
}

/**
 * @param {import('./types.js').BlockHeaderWithCommitmentsType} header
 * @returns {import('../../jsonrpc/types.js').BlockHeaderWithCommitments}
 */
export function blockHeaderWithCommitmentsToRpc(header) {
	return {
		...blockHeaderToRpc(header),
		event_commitment: header.event_commitment.toHex(),
		transaction_commitment: header.transaction_commitment.toHex(),
		receipt_commitment: header.receipt_commitment.toHex(),
		state_diff_commitment: header.state_diff_commitment.toHex(),
		event_count: header.event_count,
		transaction_count: header.transaction_count,
		state_diff_length: header.state_diff_length,
	};
}
