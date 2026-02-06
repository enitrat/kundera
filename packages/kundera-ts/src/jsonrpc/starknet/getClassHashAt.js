/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getClassHashAt";

/**
 * @param {BlockId} blockId
 * @param {string} contractAddress
 * @returns {{ method: 'starknet_getClassHashAt', params: [BlockId, string] }}
 */
export function GetClassHashAtRequest(blockId, contractAddress) {
	return { method, params: [blockId, contractAddress] };
}
