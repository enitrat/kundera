/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../types.js').FunctionCall} FunctionCall */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_call";

/**
 * @param {FunctionCall} request
 * @param {BlockId} [blockId='latest']
 * @returns {{ method: 'starknet_call', params: [FunctionCall, BlockId] }}
 */
export function CallRequest(request, blockId = "latest") {
	return { method, params: [request, blockId] };
}
