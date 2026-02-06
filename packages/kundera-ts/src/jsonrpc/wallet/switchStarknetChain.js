/** @typedef {import('../../provider/schemas/WalletRpcSchema.js').WalletSwitchChainParams} WalletSwitchChainParams */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_switchStarknetChain";

/**
 * @param {WalletSwitchChainParams} params
 * @returns {{ method: 'wallet_switchStarknetChain', params: [WalletSwitchChainParams] }}
 */
export function SwitchStarknetChainRequest(params) {
	return { method, params: [params] };
}
