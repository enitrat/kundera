/**
 * Account Hash Constants
 *
 * Shared constants for transaction hash computation.
 */

import { Felt252, type Felt252Type } from '../../primitives/index.js';

/**
 * Resource type identifiers as felt (short string encoding)
 */
export const RESOURCE_TYPE = {
  L1_GAS: 0x4c315f474153n, // "L1_GAS"
  L2_GAS: 0x4c325f474153n, // "L2_GAS"
  L1_DATA: 0x4c315f44415441n, // "L1_DATA"
} as const;

/**
 * Poseidon hash of empty array (precomputed)
 * poseidonHashMany([]) = 0x2272be0f580fd156823304800919530eaa97430e972d7213ee13f4fbf7a5dbc
 * Source: @scure/starknet poseidonHashMany([])
 */
export const POSEIDON_EMPTY_ARRAY_HASH: Felt252Type = Felt252(
  0x2272be0f580fd156823304800919530eaa97430e972d7213ee13f4fbf7a5dbcn
);

/**
 * CONTRACT_ADDRESS_PREFIX = keccak256("STARKNET_CONTRACT_ADDRESS")
 */
export const CONTRACT_ADDRESS_PREFIX: Felt252Type = Felt252(
  0x535441524b4e45545f434f4e54524143545f41444452455353n
);

/**
 * Well-known selectors (precomputed)
 * These are starknet_keccak(name) values for common entry points
 */
export const KNOWN_SELECTORS: Record<string, string> = {
  // Account methods
  __execute__:
    '0x15d40a3d6ca2ac30f4031e42be28da9b056fef9bb7357ac5e85627ee876e5ad',
  __validate__:
    '0x162da33a4585851fe8d3af3c2a9c60b557814e221e0d4f30ff0b2189d9c7775',
  __validate_declare__:
    '0x289da278a8dc833409cabfdad1581e8e7d40e42dcaed693fa4008dcdb4963b3',
  __validate_deploy__:
    '0x36fcbf06cd96843058359e1a75928beacfac10727dab22a3972f0af8aa92895',
  // ERC20 methods
  transfer:
    '0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
  transferFrom:
    '0x41b033f4a31df8067c24d1e9b550a2ce75fd4a29e1147571f8f3b1b79e9a0fd',
  approve:
    '0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c',
  balanceOf:
    '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e',
  // ERC721 methods
  mint:
    '0x2f0b3c5710379609eb5495f1ecd348cb28167711b73609fe565a72734550354',
  // UDC methods
  deployContract:
    '0x5df99ae77df976b4f0e5cf28c7dcfe09bd6e81aab787b19ac0c08e03d928cf',
};
