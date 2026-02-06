/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getBlockWithReceipts";

/**
 * @param {BlockId} [blockId='latest']
 * @returns {{ method: 'starknet_getBlockWithReceipts', params: [BlockId] }}
 */
export function GetBlockWithReceiptsRequest(blockId = "latest") {
	return { method, params: [blockId] };
}
