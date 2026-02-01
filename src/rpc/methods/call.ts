import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, FunctionCall } from '../types.js';

/**
 * Call a contract function (read-only).
 */
export async function starknet_call(
  transport: Transport,
  request: FunctionCall,
  blockId: BlockId = 'latest',
): Promise<string[]> {
  const response = await transport.request<string[]>(
    buildRequest('starknet_call', [request, blockId]),
  );
  return unwrapResponse(response);
}
