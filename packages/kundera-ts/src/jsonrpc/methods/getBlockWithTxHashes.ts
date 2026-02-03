import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, BlockWithTxHashes, PreConfirmedBlockWithTxHashes } from '../types.js';

/**
 * Get a block with transaction hashes.
 */
export async function starknet_getBlockWithTxHashes(
  transport: Transport,
  blockId: BlockId = 'latest',
): Promise<BlockWithTxHashes | PreConfirmedBlockWithTxHashes> {
  const response = await transport.request<
    BlockWithTxHashes | PreConfirmedBlockWithTxHashes
  >(buildRequest('starknet_getBlockWithTxHashes', [blockId]));
  return unwrapResponse(response);
}
