import { Felt252 } from '../Felt252/index.js';
import type { Felt252Input } from '../Felt252/types.js';
import { MAX_CLASS_HASH } from './constants.js';
import type { ClassHashType } from './types.js';

/**
 * Create a ClassHash from Felt252 (with validation)
 */
export function from(felt: Felt252Input): ClassHashType {
  const f = Felt252(felt);
  if (f.toBigInt() >= MAX_CLASS_HASH) {
    throw new Error('ClassHash must be < 2^251');
  }
  return f as unknown as ClassHashType;
}
