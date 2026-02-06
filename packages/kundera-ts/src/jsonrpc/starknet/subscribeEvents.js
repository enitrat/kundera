/** @typedef {import('../types.js').EventsSubscriptionParams} EventsSubscriptionParams */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_subscribeEvents";

/**
 * @param {EventsSubscriptionParams} [params]
 * @returns {RequestArguments}
 */
export function SubscribeEventsRequest(params) {
	/** @type {unknown[]} */
	const requestParams = [];
	if (params) {
		requestParams.push(params.from_address ?? null);
		requestParams.push(params.keys ?? null);
		requestParams.push(params.block_id ?? null);
		if (params.finality_status !== undefined) {
			requestParams.push(params.finality_status);
		}
	}
	return { method, params: requestParams };
}
