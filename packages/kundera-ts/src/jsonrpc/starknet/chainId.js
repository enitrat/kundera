/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_chainId";

/**
 * @returns {RequestArguments}
 */
export function ChainIdRequest() {
  return { method, params: [] };
}
