/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_blockNumber";

/**
 * @returns {RequestArguments}
 */
export function BlockNumberRequest() {
  return { method, params: [] };
}
