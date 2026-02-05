import { Felt252 } from '../Felt252/index.js';
import { MAX_CLASS_HASH } from './constants.js';

/**
 * Create a ClassHash from Felt252 (with validation)
 * @param {import('../Felt252/types.js').Felt252Input} felt
 * @returns {import('./types.js').ClassHashType}
 */
export function from(felt) {
  const f = Felt252(felt);
  if (f.toBigInt() >= MAX_CLASS_HASH) {
    throw new Error('ClassHash must be < 2^251');
  }
  return /** @type {any} */ (f);
}
