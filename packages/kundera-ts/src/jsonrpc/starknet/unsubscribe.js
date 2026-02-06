/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_unsubscribe";

/**
 * @param {string} subscriptionId
 * @returns {RequestArguments}
 */
export function UnsubscribeRequest(subscriptionId) {
  return { method, params: [subscriptionId] };
}
