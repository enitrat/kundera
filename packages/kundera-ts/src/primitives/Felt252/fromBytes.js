import { withFeltPrototype } from './internal.js';

/**
 * Create Felt252 from Uint8Array bytes
 * @param {Uint8Array} bytes
 * @returns {import('./types.js').Felt252Type}
 */
export function fromBytes(bytes) {
  if (bytes.length !== 32) {
    throw new Error('Felt252 must be exactly 32 bytes');
  }
  return withFeltPrototype(new Uint8Array(bytes));
}
