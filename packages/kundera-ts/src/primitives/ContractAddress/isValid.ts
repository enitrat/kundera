import { Felt252 } from '../Felt252/index.js';
import type { Felt252Type, Felt252Input } from '../Felt252/types.js';
import { MAX_CONTRACT_ADDRESS } from './constants.js';

export function isValidContractAddress(felt: Felt252Type): boolean {
  return felt.toBigInt() < MAX_CONTRACT_ADDRESS;
}

export function isValid(felt: Felt252Input): boolean {
  return isValidContractAddress(Felt252(felt));
}
