/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getStorageProof";

/**
 * @param {BlockId} blockId
 * @param {string[]} classHashes
 * @param {string[]} contractAddresses
 * @param {{ contract_address: string; storage_keys: string[] }[]} contractStorageKeys
 * @returns {{ method: 'starknet_getStorageProof', params: [BlockId, string[], string[], { contract_address: string; storage_keys: string[] }[]] }}
 */
export function GetStorageProofRequest(
	blockId,
	classHashes,
	contractAddresses,
	contractStorageKeys,
) {
	return {
		method,
		params: [blockId, classHashes, contractAddresses, contractStorageKeys],
	};
}
