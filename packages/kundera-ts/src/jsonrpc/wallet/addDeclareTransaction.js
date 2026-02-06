/** @typedef {import('../../provider/schemas/WalletRpcSchema.js').WalletDeclareParams} WalletDeclareParams */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_addDeclareTransaction";

/**
 * @param {WalletDeclareParams} params
 * @returns {{ method: 'wallet_addDeclareTransaction', params: [WalletDeclareParams] }}
 */
export function AddDeclareTransactionRequest(params) {
	return { method, params: [params] };
}
