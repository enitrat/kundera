import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { PendingTransactionsSubscriptionParams } from '../types.js';

/**
 * Subscribe to new pending transactions.
 */
export async function starknet_subscribeNewTransactions(
  transport: Transport,
  params?: PendingTransactionsSubscriptionParams,
): Promise<string> {
  const requestParams: unknown[] = [];
  if (params) {
    requestParams.push(params.finality_status ?? null);
    if (params.sender_address !== undefined) {
      requestParams.push(params.sender_address);
    }
  }
  const response = await transport.request<string>(
    buildRequest('starknet_subscribeNewTransactions', requestParams),
  );
  return unwrapResponse(response);
}
