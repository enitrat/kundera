import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, BlockTransactionTrace } from '../types.js';

/**
 * Trace all transactions in a block.
 */
export async function starknet_traceBlockTransactions(
  transport: Transport,
  blockId: BlockId,
): Promise<BlockTransactionTrace[]> {
  const response = await transport.request<BlockTransactionTrace[]>(
    buildRequest('starknet_traceBlockTransactions', [blockId]),
  );
  return unwrapResponse(response);
}
