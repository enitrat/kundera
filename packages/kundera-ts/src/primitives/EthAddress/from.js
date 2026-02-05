import { Felt252 } from '../Felt252/index.js';
import { MAX_ETH_ADDRESS } from './constants.js';

/**
 * Create an EthAddress from Felt252 (with validation)
 * @param {import('../Felt252/types.js').Felt252Input} felt
 * @returns {import('./types.js').EthAddressType}
 */
export function from(felt) {
  const f = Felt252(felt);
  if (f.toBigInt() >= MAX_ETH_ADDRESS) {
    throw new Error('EthAddress must be < 2^160');
  }
  return /** @type {import('./types.js').EthAddressType} */ (
    /** @type {unknown} */ (f)
  );
}
