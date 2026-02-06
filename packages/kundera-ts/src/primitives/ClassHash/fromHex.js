import { fromHex as feltFromHex } from '../Felt252/fromHex.js';
import { MAX_CLASS_HASH } from './constants.js';

/**
 * Create ClassHash from hex string
 * @param {string} hex
 * @returns {import('./types.js').ClassHashType}
 */
export function fromHex(hex) {
  const f = feltFromHex(hex);
  if (f.toBigInt() >= MAX_CLASS_HASH) {
    throw new Error('ClassHash must be < 2^251');
  }
  return /** @type {any} */ (f);
}
