import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';

export interface BlockHashAndNumber {
  block_hash: string;
  block_number: number;
}

/**
 * Get the current block hash and number.
 */
export async function starknet_blockHashAndNumber(
  transport: Transport,
): Promise<BlockHashAndNumber> {
  const response = await transport.request<BlockHashAndNumber>(
    buildRequest('starknet_blockHashAndNumber', []),
  );
  return unwrapResponse(response);
}
