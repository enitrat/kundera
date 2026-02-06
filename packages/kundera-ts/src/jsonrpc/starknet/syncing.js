/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_syncing";

/**
 * @returns {RequestArguments}
 */
export function SyncingRequest() {
  return { method, params: [] };
}
