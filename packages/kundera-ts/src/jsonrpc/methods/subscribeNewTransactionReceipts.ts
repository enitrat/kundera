import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { TransactionReceiptsSubscriptionParams } from '../types.js';

/**
 * Subscribe to new transaction receipts.
 */
export async function starknet_subscribeNewTransactionReceipts(
  transport: Transport,
  params?: TransactionReceiptsSubscriptionParams,
): Promise<string> {
  const requestParams: unknown[] = [];
  if (params) {
    requestParams.push(params.finality_status ?? null);
    if (params.sender_address !== undefined) {
      requestParams.push(params.sender_address);
    }
  }
  const response = await transport.request<string>(
    buildRequest('starknet_subscribeNewTransactionReceipts', requestParams),
  );
  return unwrapResponse(response);
}
