/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "wallet_deploymentData";

/**
 * @returns {{ method: 'wallet_deploymentData', params: [] }}
 */
export function DeploymentDataRequest() {
	return { method, params: [] };
}
