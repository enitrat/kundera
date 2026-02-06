/** @typedef {import('../types.js').EventsFilter} EventsFilter */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_getEvents";

/**
 * @param {EventsFilter} filter
 * @returns {{ method: 'starknet_getEvents', params: [EventsFilter] }}
 */
export function GetEventsRequest(filter) {
	return { method, params: [filter] };
}
