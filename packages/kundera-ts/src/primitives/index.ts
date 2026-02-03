/**
 * Starknet Primitives
 *
 * Core types for the Starknet ecosystem.
 * This file is a barrel that composes the per-primitive modules.
 */

import { Felt252 } from './Felt252/index.js';
import { ContractAddress, MAX_CONTRACT_ADDRESS } from './ContractAddress/index.js';
import { ClassHash } from './ClassHash/index.js';
import { StorageKey } from './StorageKey/index.js';

// Felt252
export type { Felt252Type, Felt252Input, FeltMethods } from './Felt252/index.js';
export { FIELD_PRIME, MAX_SHORT_STRING_LENGTH, Felt252 } from './Felt252/index.js';

// ContractAddress
export type { ContractAddressType } from './ContractAddress/index.js';
export { ContractAddress, MAX_CONTRACT_ADDRESS } from './ContractAddress/index.js';

// ClassHash
export type { ClassHashType } from './ClassHash/index.js';
export { ClassHash } from './ClassHash/index.js';

// StorageKey
export type { StorageKeyType } from './StorageKey/index.js';
export { StorageKey } from './StorageKey/index.js';

// EthAddress
export type { EthAddressType } from './EthAddress/index.js';
export { EthAddress, MAX_ETH_ADDRESS } from './EthAddress/index.js';

// ShortString
export {
  encodeShortString,
  encodeShortStringHex,
  decodeShortString,
} from './ShortString/index.js';

// Aliases for API ergonomics
export const Felt = Felt252;
export const Address = ContractAddress;
export const Class = ClassHash;
export const Storage = StorageKey;

// Compatibility constants
export const MAX_ADDRESS = MAX_CONTRACT_ADDRESS;
