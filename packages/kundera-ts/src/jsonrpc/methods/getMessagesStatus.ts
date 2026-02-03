import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { MessagesStatusResponse } from '../types.js';

/**
 * Get messages status by L1 transaction hash.
 */
export async function starknet_getMessagesStatus(
  transport: Transport,
  l1TransactionHash: string,
): Promise<MessagesStatusResponse> {
  const response = await transport.request<MessagesStatusResponse>(
    buildRequest('starknet_getMessagesStatus', [l1TransactionHash]),
  );
  return unwrapResponse(response);
}
