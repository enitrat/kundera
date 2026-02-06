/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getNonce";

/**
 * @param {BlockId} blockId
 * @param {string} contractAddress
 * @returns {{ method: 'starknet_getNonce', params: [BlockId, string] }}
 */
export function GetNonceRequest(blockId, contractAddress) {
	return { method, params: [blockId, contractAddress] };
}
