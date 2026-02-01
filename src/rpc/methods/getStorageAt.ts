import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId } from '../types.js';
import { type ContractAddressType, type Felt252Type } from '../../primitives/index.js';

/**
 * Get a storage value at a given key.
 */
export async function starknet_getStorageAt(
  transport: Transport,
  contractAddress: ContractAddressType | string,
  key: Felt252Type | string,
  blockId: BlockId = 'latest',
): Promise<string> {
  const address = typeof contractAddress === 'string' ? contractAddress : contractAddress.toHex();
  const keyHex = typeof key === 'string' ? key : key.toHex();
  const response = await transport.request<string>(
    buildRequest('starknet_getStorageAt', [address, keyHex, blockId]),
  );
  return unwrapResponse(response);
}
