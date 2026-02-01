import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, MessageFeeEstimate, MsgFromL1 } from '../types.js';

/**
 * Estimate message fee.
 */
export async function starknet_estimateMessageFee(
  transport: Transport,
  message: MsgFromL1,
  blockId: BlockId = 'latest',
): Promise<MessageFeeEstimate> {
  const response = await transport.request<MessageFeeEstimate>(
    buildRequest('starknet_estimateMessageFee', [message, blockId]),
  );
  return unwrapResponse(response);
}
