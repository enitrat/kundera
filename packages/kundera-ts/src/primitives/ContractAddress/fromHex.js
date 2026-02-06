import { fromHex as feltFromHex } from '../Felt252/fromHex.js';
import { isValidContractAddress } from './isValid.js';

/**
 * Create ContractAddress from hex string
 * @param {string} hex
 * @returns {import('./types.js').ContractAddressType}
 */
export function fromHex(hex) {
  const f = feltFromHex(hex);
  if (!isValidContractAddress(f)) {
    throw new Error('Contract address must be < 2^251');
  }
  return /** @type {any} */ (f);
}
