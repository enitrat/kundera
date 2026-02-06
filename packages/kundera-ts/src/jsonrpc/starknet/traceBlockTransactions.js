/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_traceBlockTransactions";

/**
 * @param {BlockId} blockId
 * @returns {RequestArguments}
 */
export function TraceBlockTransactionsRequest(blockId) {
  return { method, params: [blockId] };
}
