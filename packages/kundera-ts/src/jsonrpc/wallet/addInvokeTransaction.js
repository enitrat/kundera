/** @typedef {import('../../provider/schemas/WalletRpcSchema.js').WalletCall} WalletCall */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_addInvokeTransaction";

/**
 * @param {WalletCall[]} calls
 * @returns {{ method: 'wallet_addInvokeTransaction', params: [{ calls: WalletCall[] }] }}
 */
export function AddInvokeTransactionRequest(calls) {
	return { method, params: [{ calls }] };
}
