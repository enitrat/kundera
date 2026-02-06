/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_supportedWalletApi";

/**
 * @returns {{ method: 'wallet_supportedWalletApi', params: [] }}
 */
export function SupportedWalletApiRequest() {
	return { method, params: [] };
}
