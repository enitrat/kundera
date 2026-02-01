import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, PreConfirmedStateUpdate, StateUpdate } from '../types.js';

/**
 * Get state update by block.
 */
export async function starknet_getStateUpdate(
  transport: Transport,
  blockId: BlockId = 'latest',
): Promise<StateUpdate | PreConfirmedStateUpdate> {
  const response = await transport.request<StateUpdate | PreConfirmedStateUpdate>(
    buildRequest('starknet_getStateUpdate', [blockId]),
  );
  return unwrapResponse(response);
}
