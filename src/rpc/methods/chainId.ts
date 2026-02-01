import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';

/**
 * Get the chain ID.
 */
export async function starknet_chainId(transport: Transport): Promise<string> {
  const response = await transport.request<string>(
    buildRequest('starknet_chainId', []),
  );
  return unwrapResponse(response);
}
