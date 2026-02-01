import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, ContractClassResponse } from '../types.js';
import { type ContractAddressType } from '../../primitives/index.js';

/**
 * Get class definition at contract address.
 */
export async function starknet_getClassAt(
  transport: Transport,
  contractAddress: ContractAddressType | string,
  blockId: BlockId = 'latest',
): Promise<ContractClassResponse> {
  const address = typeof contractAddress === 'string' ? contractAddress : contractAddress.toHex();
  const response = await transport.request<ContractClassResponse>(
    buildRequest('starknet_getClassAt', [blockId, address]),
  );
  return unwrapResponse(response);
}
