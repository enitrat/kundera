/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_getPermissions";

/**
 * @returns {{ method: 'wallet_getPermissions', params: [] }}
 */
export function GetPermissionsRequest() {
	return { method, params: [] };
}
