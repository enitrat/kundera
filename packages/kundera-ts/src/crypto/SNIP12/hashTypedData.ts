/**
 * Hash Typed Data for SNIP-12
 *
 * Main entry point for SNIP-12 typed data hashing.
 *
 * Computes: hash_array(PREFIX_MESSAGE, Enc[domain], account, Enc[message])
 *
 * @see https://github.com/starknet-io/SNIPs/blob/main/SNIPS/snip-12.md
 */

import type { Felt252Type } from '../../primitives/index.js';
import { Felt252 } from '../../primitives/index.js';
import { poseidonHashMany } from '../hash.js';
import { hashDomain } from './hashDomain.js';
import { hashStruct } from './hashStruct.js';
import type { TypedData } from './types.js';

/**
 * SNIP-12 message prefix: "StarkNet Message"
 *
 * This is the literal string encoded as a felt.
 */
const STARKNET_MESSAGE_PREFIX = Felt252(
  0x537461726b4e6574204d657373616765n, // "StarkNet Message"
);

/**
 * Hash typed data according to SNIP-12 specification
 *
 * hash = hash_array(PREFIX_MESSAGE, domain_hash, account, message_hash)
 *
 * @param typedData - The typed data to hash
 * @param accountAddress - The account address (as hex string, bigint, or Felt252)
 * @returns The typed data hash as Felt252
 *
 * @example
 * ```typescript
 * import { SNIP12 } from '@kundera-sn/kundera-ts';
 *
 * const typedData = {
 *   domain: {
 *     name: 'MyDapp',
 *     version: '1',
 *     chainId: 'SN_MAIN',
 *   },
 *   types: {
 *     Transfer: [
 *       { name: 'recipient', type: 'ContractAddress' },
 *       { name: 'amount', type: 'u256' },
 *     ],
 *   },
 *   primaryType: 'Transfer',
 *   message: {
 *     recipient: '0x123...',
 *     amount: 1000000000000000000n,
 *   },
 * };
 *
 * const hash = SNIP12.hashTypedData(typedData, accountAddress);
 * ```
 */
export function hashTypedData(
  typedData: TypedData,
  accountAddress: string | bigint | Felt252Type,
): Felt252Type {
  // Hash domain separator
  const domainHash = hashDomain(typedData.domain);

  // Hash message struct
  const messageHash = hashStruct(
    typedData.primaryType,
    typedData.message,
    typedData.types,
  );

  // Convert account address to felt
  const account = typeof accountAddress === 'object' && 'toBigInt' in accountAddress
    ? accountAddress
    : Felt252(accountAddress);

  // Final hash: hash_array(prefix, domain_hash, account, message_hash)
  return poseidonHashMany([
    STARKNET_MESSAGE_PREFIX,
    domainHash,
    account,
    messageHash,
  ]);
}
