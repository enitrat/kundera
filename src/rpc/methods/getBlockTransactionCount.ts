import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId } from '../types.js';

/**
 * Get number of transactions in a block.
 */
export async function starknet_getBlockTransactionCount(
  transport: Transport,
  blockId: BlockId = 'latest',
): Promise<number> {
  const response = await transport.request<number>(
    buildRequest('starknet_getBlockTransactionCount', [blockId]),
  );
  return unwrapResponse(response);
}
