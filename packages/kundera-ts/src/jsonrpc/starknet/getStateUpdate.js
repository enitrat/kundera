/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getStateUpdate";

/**
 * @param {BlockId} [blockId='latest']
 * @returns {{ method: 'starknet_getStateUpdate', params: [BlockId] }}
 */
export function GetStateUpdateRequest(blockId = "latest") {
	return { method, params: [blockId] };
}
