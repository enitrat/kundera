import { Felt252 } from '../Felt252/index.js';
import type { Felt252Input } from '../Felt252/types.js';
import { MAX_ETH_ADDRESS } from './constants.js';

export function isValid(felt: Felt252Input): boolean {
  return Felt252(felt).toBigInt() < MAX_ETH_ADDRESS;
}
