import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';

/**
 * Get the Starknet spec version.
 */
export async function starknet_specVersion(transport: Transport): Promise<string> {
  const response = await transport.request<string>(
    buildRequest('starknet_specVersion', []),
  );
  return unwrapResponse(response);
}
