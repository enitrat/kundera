import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { TxnWithHash } from '../types.js';

/**
 * Get transaction by hash.
 */
export async function starknet_getTransactionByHash(
  transport: Transport,
  transactionHash: string,
): Promise<TxnWithHash> {
  const response = await transport.request<TxnWithHash>(
    buildRequest('starknet_getTransactionByHash', [transactionHash]),
  );
  return unwrapResponse(response);
}
