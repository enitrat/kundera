import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { NewHeadsSubscriptionParams } from '../types.js';

/**
 * Subscribe to new block headers.
 */
export async function starknet_subscribeNewHeads(
  transport: Transport,
  params?: NewHeadsSubscriptionParams,
): Promise<string> {
  const requestParams = params?.block_id ? [params.block_id] : [];
  const response = await transport.request<string>(
    buildRequest('starknet_subscribeNewHeads', requestParams),
  );
  return unwrapResponse(response);
}
