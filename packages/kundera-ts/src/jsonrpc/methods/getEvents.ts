import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, EventsResponse } from '../types.js';

export interface EventsFilter {
  from_block?: BlockId;
  to_block?: BlockId;
  address?: string;
  keys?: string[][];
  continuation_token?: string;
  chunk_size: number;
}

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
