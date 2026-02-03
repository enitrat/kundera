import { Felt252 } from '../Felt252/index.js';
import type { Felt252Input } from '../Felt252/types.js';
import { MAX_ETH_ADDRESS } from './constants.js';
import type { EthAddressType } from './types.js';

/**
 * Create an EthAddress from Felt252 (with validation)
 */
export function from(felt: Felt252Input): EthAddressType {
  const f = Felt252(felt);
  if (f.toBigInt() >= MAX_ETH_ADDRESS) {
    throw new Error('EthAddress must be < 2^160');
  }
  return f as unknown as EthAddressType;
}
