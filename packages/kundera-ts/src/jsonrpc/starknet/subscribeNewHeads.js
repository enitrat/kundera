/** @typedef {import('../types.js').NewHeadsSubscriptionParams} NewHeadsSubscriptionParams */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_subscribeNewHeads";

/**
 * @param {NewHeadsSubscriptionParams} [params]
 * @returns {{ method: 'starknet_subscribeNewHeads', params: unknown[] }}
 */
export function SubscribeNewHeadsRequest(params) {
	const requestParams = params?.block_id ? [params.block_id] : [];
	return { method, params: requestParams };
}
