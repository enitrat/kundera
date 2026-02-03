import { Felt252 } from '../Felt252/index.js';
import type { Felt252Input } from '../Felt252/types.js';
import { MAX_STORAGE_KEY } from './constants.js';
import type { StorageKeyType } from './types.js';

/**
 * Create a StorageKey from Felt252 (with validation)
 */
export function from(felt: Felt252Input): StorageKeyType {
  const f = Felt252(felt);
  if (f.toBigInt() >= MAX_STORAGE_KEY) {
    throw new Error('StorageKey must be < 2^251');
  }
  return f as unknown as StorageKeyType;
}
