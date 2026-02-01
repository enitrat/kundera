import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { EventsSubscriptionParams } from '../types.js';

/**
 * Subscribe to events.
 */
export async function starknet_subscribeEvents(
  transport: Transport,
  params?: EventsSubscriptionParams,
): Promise<string> {
  const requestParams: unknown[] = [];
  if (params) {
    requestParams.push(params.from_address ?? null);
    requestParams.push(params.keys ?? null);
    requestParams.push(params.block_id ?? null);
    if (params.finality_status !== undefined) {
      requestParams.push(params.finality_status);
    }
  }
  const response = await transport.request<string>(
    buildRequest('starknet_subscribeEvents', requestParams),
  );
  return unwrapResponse(response);
}
