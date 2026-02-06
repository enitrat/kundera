/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getClass";

/**
 * @param {BlockId} blockId
 * @param {string} classHash
 * @returns {RequestArguments}
 */
export function GetClassRequest(blockId, classHash) {
  return { method, params: [blockId, classHash] };
}
