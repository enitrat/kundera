import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, TxnWithHash } from '../types.js';

/**
 * Get transaction by block id and index.
 */
export async function starknet_getTransactionByBlockIdAndIndex(
  transport: Transport,
  blockId: BlockId,
  index: number,
): Promise<TxnWithHash> {
  const response = await transport.request<TxnWithHash>(
    buildRequest('starknet_getTransactionByBlockIdAndIndex', [blockId, index]),
  );
  return unwrapResponse(response);
}
