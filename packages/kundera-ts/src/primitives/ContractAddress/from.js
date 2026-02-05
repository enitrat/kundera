import { Felt252 } from '../Felt252/index.js';
import { isValidContractAddress } from './isValid.js';

/**
 * Create a ContractAddress from Felt252 (with validation)
 * @param {import('../Felt252/types.js').Felt252Input} felt
 * @returns {import('./types.js').ContractAddressType}
 */
export function from(felt) {
  const f = Felt252(felt);
  if (!isValidContractAddress(f)) {
    throw new Error('Contract address must be < 2^251');
  }
  return /** @type {any} */ (f);
}
