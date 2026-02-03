import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, ContractClass } from '../types.js';
import { type ClassHashType } from '../../primitives/index.js';

/**
 * Get class definition by hash.
 */
export async function starknet_getClass(
  transport: Transport,
  classHash: ClassHashType | string,
  blockId: BlockId = 'latest',
): Promise<ContractClass> {
  const hash = typeof classHash === 'string' ? classHash : classHash.toHex();
  const response = await transport.request<ContractClass>(
    buildRequest('starknet_getClass', [blockId, hash]),
  );
  return unwrapResponse(response);
}
