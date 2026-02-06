/** @typedef {import('../types.js').TransactionReceiptsSubscriptionParams} TransactionReceiptsSubscriptionParams */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_subscribeNewTransactionReceipts";

/**
 * @param {TransactionReceiptsSubscriptionParams} [params]
 * @returns {RequestArguments}
 */
export function SubscribeNewTransactionReceiptsRequest(params) {
  /** @type {unknown[]} */
  const requestParams = [];
  if (params) {
    requestParams.push(params.finality_status ?? null);
    if (params.sender_address !== undefined) {
      requestParams.push(params.sender_address);
    }
  }
  return { method, params: requestParams };
}
