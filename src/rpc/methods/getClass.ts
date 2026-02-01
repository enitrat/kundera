import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, ContractClassResponse } from '../types.js';
import { type ClassHashType } from '../../primitives/index.js';

/**
 * Get class definition by hash.
 */
export async function starknet_getClass(
  transport: Transport,
  classHash: ClassHashType | string,
  blockId: BlockId = 'latest',
): Promise<ContractClassResponse> {
  const hash = typeof classHash === 'string' ? classHash : classHash.toHex();
  const response = await transport.request<ContractClassResponse>(
    buildRequest('starknet_getClass', [blockId, hash]),
  );
  return unwrapResponse(response);
}
