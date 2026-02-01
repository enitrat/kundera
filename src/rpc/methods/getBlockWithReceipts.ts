import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type {
  BlockId,
  BlockWithReceipts,
  PreConfirmedBlockWithReceipts,
} from '../types.js';

/**
 * Get a block with receipts.
 */
export async function starknet_getBlockWithReceipts(
  transport: Transport,
  blockId: BlockId = 'latest',
): Promise<BlockWithReceipts | PreConfirmedBlockWithReceipts> {
  const response = await transport.request<
    BlockWithReceipts | PreConfirmedBlockWithReceipts
  >(buildRequest('starknet_getBlockWithReceipts', [blockId]));
  return unwrapResponse(response);
}
