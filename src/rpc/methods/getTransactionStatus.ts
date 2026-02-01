import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { TransactionStatus } from '../types.js';

/**
 * Get transaction status.
 */
export async function starknet_getTransactionStatus(
  transport: Transport,
  transactionHash: string,
): Promise<TransactionStatus> {
  const response = await transport.request<TransactionStatus>(
    buildRequest('starknet_getTransactionStatus', [transactionHash]),
  );
  return unwrapResponse(response);
}
