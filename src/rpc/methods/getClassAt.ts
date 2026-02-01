import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, ContractClass } from '../types.js';
import { type ContractAddressType } from '../../primitives/index.js';

/**
 * Get class definition at contract address.
 */
export async function starknet_getClassAt(
  transport: Transport,
  contractAddress: ContractAddressType | string,
  blockId: BlockId = 'latest',
): Promise<ContractClass> {
  const address = typeof contractAddress === 'string' ? contractAddress : contractAddress.toHex();
  const response = await transport.request<ContractClass>(
    buildRequest('starknet_getClassAt', [blockId, address]),
  );
  return unwrapResponse(response);
}
