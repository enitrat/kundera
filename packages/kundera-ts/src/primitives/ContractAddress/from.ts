import { Felt252 } from '../Felt252/index.js';
import type { Felt252Input } from '../Felt252/types.js';
import { isValidContractAddress } from './isValid.js';
import type { ContractAddressType } from './types.js';

/**
 * Create a ContractAddress from Felt252 (with validation)
 */
export function from(felt: Felt252Input): ContractAddressType {
  const f = Felt252(felt);
  if (!isValidContractAddress(f)) {
    throw new Error('Contract address must be < 2^251');
  }
  return f as unknown as ContractAddressType;
}
