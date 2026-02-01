import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, BlockWithTxs, PreConfirmedBlockWithTxs } from '../types.js';

/**
 * Get a block with full transactions.
 */
export async function starknet_getBlockWithTxs(
  transport: Transport,
  blockId: BlockId = 'latest',
): Promise<BlockWithTxs | PreConfirmedBlockWithTxs> {
  const response = await transport.request<BlockWithTxs | PreConfirmedBlockWithTxs>(
    buildRequest('starknet_getBlockWithTxs', [blockId]),
  );
  return unwrapResponse(response);
}
