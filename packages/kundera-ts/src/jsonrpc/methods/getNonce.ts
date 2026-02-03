import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId } from '../types.js';
import { type ContractAddressType } from '../../primitives/index.js';

/**
 * Get the nonce of an account contract.
 */
export async function starknet_getNonce(
  transport: Transport,
  contractAddress: ContractAddressType | string,
  blockId: BlockId = 'pending',
): Promise<string> {
  const address = typeof contractAddress === 'string' ? contractAddress : contractAddress.toHex();
  const response = await transport.request<string>(
    buildRequest('starknet_getNonce', [blockId, address]),
  );
  return unwrapResponse(response);
}
