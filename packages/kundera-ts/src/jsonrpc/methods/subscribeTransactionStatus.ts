import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';

/**
 * Subscribe to a transaction status.
 */
export async function starknet_subscribeTransactionStatus(
  transport: Transport,
  transactionHash: string,
): Promise<string> {
  const response = await transport.request<string>(
    buildRequest('starknet_subscribeTransactionStatus', [transactionHash]),
  );
  return unwrapResponse(response);
}
