/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_blockHashAndNumber";

/**
 * @returns {RequestArguments}
 */
export function BlockHashAndNumberRequest() {
	return { method, params: [] };
}
