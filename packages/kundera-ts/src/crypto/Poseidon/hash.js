import { poseidonHash as poseidonHashScure, poseidonHashMany as poseidonHashManyScure } from '@scure/starknet';
import { Felt252 } from '../../primitives/Felt252/index.js';

/**
 * Poseidon hash of two felts (pure JS)
 * @param {import('../../primitives/Felt252/types.js').Felt252Type} a
 * @param {import('../../primitives/Felt252/types.js').Felt252Type} b
 * @returns {import('./types.js').PoseidonHash}
 */
export function hash(a, b) {
  const result = poseidonHashScure(a.toBigInt(), b.toBigInt());
  return Felt252(result);
}

/**
 * Poseidon hash of array
 * @param {import('../../primitives/Felt252/types.js').Felt252Type[]} values
 * @returns {import('./types.js').PoseidonHash}
 */
export function hashMany(values) {
  if (values.length === 0) {
    return Felt252(0n);
  }
  const bigints = values.map(v => v.toBigInt());
  const result = poseidonHashManyScure(bigints);
  return Felt252(result);
}
