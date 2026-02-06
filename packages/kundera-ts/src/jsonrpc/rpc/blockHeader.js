import {
  hexToFelt,
  hexToAddress,
  feltToHex,
  addressToHex,
  resourcePriceFromRpc,
  resourcePriceToRpc,
} from './helpers.js';

/**
 * @param {import('../types.js').BlockHeader} rpc
 * @returns {import('../rich.js').RichBlockHeader}
 */
export function blockHeaderFromRpc(rpc) {
  return {
    block_hash: hexToFelt(rpc.block_hash),
    parent_hash: hexToFelt(rpc.parent_hash),
    block_number: rpc.block_number,
    new_root: hexToFelt(rpc.new_root),
    timestamp: rpc.timestamp,
    sequencer_address: hexToAddress(rpc.sequencer_address),
    l1_gas_price: resourcePriceFromRpc(rpc.l1_gas_price),
    l2_gas_price: resourcePriceFromRpc(rpc.l2_gas_price),
    l1_data_gas_price: resourcePriceFromRpc(rpc.l1_data_gas_price),
    l1_da_mode: rpc.l1_da_mode,
    starknet_version: rpc.starknet_version,
  };
}

/**
 * @param {import('../rich.js').RichBlockHeader} rich
 * @returns {import('../types.js').BlockHeader}
 */
export function blockHeaderToRpc(rich) {
  return {
    block_hash: feltToHex(rich.block_hash),
    parent_hash: feltToHex(rich.parent_hash),
    block_number: rich.block_number,
    new_root: feltToHex(rich.new_root),
    timestamp: rich.timestamp,
    sequencer_address: addressToHex(rich.sequencer_address),
    l1_gas_price: resourcePriceToRpc(rich.l1_gas_price),
    l2_gas_price: resourcePriceToRpc(rich.l2_gas_price),
    l1_data_gas_price: resourcePriceToRpc(rich.l1_data_gas_price),
    l1_da_mode: rich.l1_da_mode,
    starknet_version: rich.starknet_version,
  };
}

/**
 * @param {import('../types.js').BlockHeaderWithCommitments} rpc
 * @returns {import('../rich.js').RichBlockHeaderWithCommitments}
 */
export function blockHeaderWithCommitmentsFromRpc(rpc) {
  return {
    ...blockHeaderFromRpc(rpc),
    event_commitment: hexToFelt(rpc.event_commitment),
    transaction_commitment: hexToFelt(rpc.transaction_commitment),
    receipt_commitment: hexToFelt(rpc.receipt_commitment),
    state_diff_commitment: hexToFelt(rpc.state_diff_commitment),
    event_count: rpc.event_count,
    transaction_count: rpc.transaction_count,
    state_diff_length: rpc.state_diff_length,
  };
}

/**
 * @param {import('../rich.js').RichBlockHeaderWithCommitments} rich
 * @returns {import('../types.js').BlockHeaderWithCommitments}
 */
export function blockHeaderWithCommitmentsToRpc(rich) {
  return {
    ...blockHeaderToRpc(rich),
    event_commitment: feltToHex(rich.event_commitment),
    transaction_commitment: feltToHex(rich.transaction_commitment),
    receipt_commitment: feltToHex(rich.receipt_commitment),
    state_diff_commitment: feltToHex(rich.state_diff_commitment),
    event_count: rich.event_count,
    transaction_count: rich.transaction_count,
    state_diff_length: rich.state_diff_length,
  };
}
