/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_traceTransaction";

/**
 * @param {string} transactionHash
 * @returns {RequestArguments}
 */
export function TraceTransactionRequest(transactionHash) {
  return { method, params: [transactionHash] };
}
