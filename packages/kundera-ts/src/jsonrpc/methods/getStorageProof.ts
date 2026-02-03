import type { Transport } from '../../transport/types.js';
import { buildRequest, unwrapResponse } from '../utils.js';
import type { BlockId, StorageProof } from '../types.js';

/**
 * Get storage proofs.
 */
export async function starknet_getStorageProof(
  transport: Transport,
  blockId: BlockId,
  classHashes: string[],
  contractAddresses: string[],
  contractStorageKeys: { contract_address: string; storage_keys: string[] }[],
): Promise<StorageProof> {
  const response = await transport.request<StorageProof>(
    buildRequest('starknet_getStorageProof', [
      blockId,
      classHashes,
      contractAddresses,
      contractStorageKeys,
    ]),
  );
  return unwrapResponse(response);
}
