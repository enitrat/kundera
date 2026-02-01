import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';

/**
 * Get the current block number.
 */
export async function starknet_blockNumber(transport: Transport): Promise<number> {
  const response = await transport.request<number>(
    buildRequest('starknet_blockNumber', []),
  );
  return unwrapResponse(response);
}
