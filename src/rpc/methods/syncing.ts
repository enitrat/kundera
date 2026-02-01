import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { SyncingStatus } from '../types.js';

/**
 * Get sync status.
 */
export async function starknet_syncing(
  transport: Transport,
): Promise<SyncingStatus> {
  const response = await transport.request<SyncingStatus>(
    buildRequest('starknet_syncing', []),
  );
  return unwrapResponse(response);
}
