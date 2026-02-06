/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_requestAccounts";

/**
 * @param {{ silent_mode?: boolean }} [options]
 * @returns {{ method: 'wallet_requestAccounts', params: [{ silent_mode?: boolean }] | [] }}
 */
export function RequestAccountsRequest(options) {
	return options
		? { method, params: [options] }
		: { method, params: [] };
}
