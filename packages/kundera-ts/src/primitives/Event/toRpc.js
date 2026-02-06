/**
 * @param {import('./types.js').EventType} event
 * @returns {import('../../jsonrpc/types.js').Event}
 */
export function eventToRpc(event) {
	return {
		from_address: event.from_address.toHex(),
		keys: event.keys.map((k) => k.toHex()),
		data: event.data.map((d) => d.toHex()),
	};
}

/**
 * @param {import('./types.js').EmittedEventType} event
 * @returns {import('../../jsonrpc/types.js').EmittedEvent}
 */
export function emittedEventToRpc(event) {
	return {
		...eventToRpc(event),
		block_hash: event.block_hash.toHex(),
		block_number: event.block_number,
		transaction_hash: event.transaction_hash.toHex(),
	};
}
