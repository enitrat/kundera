/** @typedef {import('../types.js').BlockId} BlockId */
/** @typedef {import('../types.js').MsgFromL1} MsgFromL1 */
/** @typedef {import('../../provider/types.js').RequestArguments} RequestArguments */

/** JSON-RPC method name */
export const method = "starknet_estimateMessageFee";

/**
 * @param {MsgFromL1} message
 * @param {BlockId} [blockId='latest']
 * @returns {RequestArguments}
 */
export function EstimateMessageFeeRequest(message, blockId = 'latest') {
  return { method, params: [message, blockId] };
}
