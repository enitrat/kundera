/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getTransactionByBlockIdAndIndex";

/**
 * @param {BlockId} blockId
 * @param {number} index
 * @returns {RequestArguments}
 */
export function GetTransactionByBlockIdAndIndexRequest(blockId, index) {
  return { method, params: [blockId, index] };
}
