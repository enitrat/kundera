/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getBlockTransactionCount";

/**
 * @param {BlockId} [blockId='latest']
 * @returns {{ method: 'starknet_getBlockTransactionCount', params: [BlockId] }}
 */
export function GetBlockTransactionCountRequest(blockId = "latest") {
	return { method, params: [blockId] };
}
