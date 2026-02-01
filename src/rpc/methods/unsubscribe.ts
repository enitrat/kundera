import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';

/**
 * Unsubscribe from a subscription.
 */
export async function starknet_unsubscribe(
  transport: Transport,
  subscriptionId: string,
): Promise<boolean> {
  const response = await transport.request<boolean>(
    buildRequest('starknet_unsubscribe', [subscriptionId]),
  );
  return unwrapResponse(response);
}
