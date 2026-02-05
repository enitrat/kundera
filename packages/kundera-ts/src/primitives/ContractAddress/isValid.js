import { Felt252 } from '../Felt252/index.js';
import { MAX_CONTRACT_ADDRESS } from './constants.js';

/**
 * Check if a Felt252Type is a valid contract address
 * @param {import('../Felt252/types.js').Felt252Type} felt
 * @returns {boolean}
 */
export function isValidContractAddress(felt) {
  return felt.toBigInt() < MAX_CONTRACT_ADDRESS;
}

/**
 * Check if input can be a valid contract address
 * @param {import('../Felt252/types.js').Felt252Input} felt
 * @returns {boolean}
 */
export function isValid(felt) {
  return isValidContractAddress(Felt252(felt));
}
