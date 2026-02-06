/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getClassAt";

/**
 * @param {BlockId} blockId
 * @param {string} contractAddress
 * @returns {{ method: 'starknet_getClassAt', params: [BlockId, string] }}
 */
export function GetClassAtRequest(blockId, contractAddress) {
	return { method, params: [blockId, contractAddress] };
}
