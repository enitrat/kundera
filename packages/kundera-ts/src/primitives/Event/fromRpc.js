import { fromHex as addressFromHex } from "../ContractAddress/fromHex.js";
import { fromHex as feltFromHex } from "../Felt252/fromHex.js";

/**
 * @param {import('../../jsonrpc/types.js').Event} rpc
 * @returns {import('./types.js').EventType}
 */
export function eventFromRpc(rpc) {
	return {
		from_address: addressFromHex(rpc.from_address),
		keys: rpc.keys.map(feltFromHex),
		data: rpc.data.map(feltFromHex),
	};
}

/**
 * @param {import('../../jsonrpc/types.js').EmittedEvent} rpc
 * @returns {import('./types.js').EmittedEventType}
 */
export function emittedEventFromRpc(rpc) {
	return {
		...eventFromRpc(rpc),
		block_hash: feltFromHex(rpc.block_hash),
		block_number: rpc.block_number,
		transaction_hash: feltFromHex(rpc.transaction_hash),
	};
}
