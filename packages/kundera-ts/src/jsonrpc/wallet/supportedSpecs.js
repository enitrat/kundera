/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_supportedSpecs";

/**
 * @returns {{ method: 'wallet_supportedSpecs', params: [] }}
 */
export function SupportedSpecsRequest() {
	return { method, params: [] };
}
