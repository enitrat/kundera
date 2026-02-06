/** @typedef {import('../../provider/schemas/WalletRpcSchema.js').WalletAddChainParams} WalletAddChainParams */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_addStarknetChain";

/**
 * @param {WalletAddChainParams} params
 * @returns {{ method: 'wallet_addStarknetChain', params: [WalletAddChainParams] }}
 */
export function AddStarknetChainRequest(params) {
	return { method, params: [params] };
}
