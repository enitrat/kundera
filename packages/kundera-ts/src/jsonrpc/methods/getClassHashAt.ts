import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId } from '../types.js';
import { type ContractAddressType } from '../../primitives/index.js';

/**
 * Get class hash at contract address.
 */
export async function starknet_getClassHashAt(
  transport: Transport,
  contractAddress: ContractAddressType | string,
  blockId: BlockId = 'latest',
): Promise<string> {
  const address = typeof contractAddress === 'string' ? contractAddress : contractAddress.toHex();
  const response = await transport.request<string>(
    buildRequest('starknet_getClassHashAt', [blockId, address]),
  );
  return unwrapResponse(response);
}
