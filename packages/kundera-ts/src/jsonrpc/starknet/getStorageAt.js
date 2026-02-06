/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getStorageAt";

/**
 * @param {string} contractAddress
 * @param {string} key
 * @param {BlockId} [blockId='latest']
 * @returns {RequestArguments}
 */
export function GetStorageAtRequest(contractAddress, key, blockId = "latest") {
	return { method, params: [contractAddress, key, blockId] };
}
