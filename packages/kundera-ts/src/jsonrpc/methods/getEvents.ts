import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { EventsFilter, EventsResponse } from '../types.js';

/**
 * Get events matching a filter.
 */
export async function starknet_getEvents(
  transport: Transport,
  filter: EventsFilter,
): Promise<EventsResponse> {
  const response = await transport.request<EventsResponse>(
    buildRequest('starknet_getEvents', [filter]),
  );
  return unwrapResponse(response);
}
