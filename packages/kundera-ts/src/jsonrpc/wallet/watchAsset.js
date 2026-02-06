/** @typedef {import('../../provider/schemas/WalletRpcSchema.js').WalletWatchAssetParams} WalletWatchAssetParams */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_watchAsset";

/**
 * @param {WalletWatchAssetParams} params
 * @returns {{ method: 'wallet_watchAsset', params: [WalletWatchAssetParams] }}
 */
export function WatchAssetRequest(params) {
	return { method, params: [params] };
}
