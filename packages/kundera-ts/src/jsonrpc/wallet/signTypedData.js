/** @typedef {import('../../provider/schemas/WalletRpcSchema.js').WalletTypedData} WalletTypedData */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_signTypedData";

/**
 * @param {WalletTypedData} typedData
 * @returns {{ method: 'wallet_signTypedData', params: [WalletTypedData] }}
 */
export function SignTypedDataRequest(typedData) {
	return { method, params: [typedData] };
}
