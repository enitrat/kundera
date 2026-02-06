/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_subscribeTransactionStatus";

/**
 * @param {string} transactionHash
 * @returns {RequestArguments}
 */
export function SubscribeTransactionStatusRequest(transactionHash) {
  return { method, params: [transactionHash] };
}
