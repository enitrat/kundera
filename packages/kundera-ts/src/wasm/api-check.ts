/**
 * WASM API Parity Check
 *
 * Compile-time validation that WASM entrypoint exports match KunderaAPI interface.
 * This file is not imported at runtime - it only exists for type checking.
 */

import type { KunderaAPI as _KunderaAPI } from '../api-interface.js';
import {
  FIELD_PRIME,
  MAX_ADDRESS,
  MAX_CONTRACT_ADDRESS,
  MAX_ETH_ADDRESS,
  Felt252,
  ContractAddress,
  ClassHash,
  StorageKey,
  EthAddress,
  Address,
  Class,
  Storage,
} from '../primitives/index.js';

import {
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
} from '../serde/index.js';

import {
  isWasmAvailable,
  isWasmLoaded,
  loadWasmCrypto,
} from '../wasm-loader/index.js';

import {
  isNativeAvailable,
  pedersenHash,
  poseidonHash,
  poseidonHashMany,
  snKeccak,
  feltAdd,
  feltSub,
  feltMul,
  feltDiv,
  feltNeg,
  feltInverse,
  feltPow,
  feltSqrt,
  sign,
  verify,
  getPublicKey,
  recover,
} from './crypto.js';

import { Pedersen, Poseidon, Felt, StarkCurve } from './namespaces/index.js';

// Type validator - ensures all exports match _KunderaAPI interface
const _wasmAPI = {
  // Primitives
  FIELD_PRIME,
  MAX_ADDRESS,
  MAX_CONTRACT_ADDRESS,
  MAX_ETH_ADDRESS,
  Felt252,
  ContractAddress,
  ClassHash,
  StorageKey,
  EthAddress,
  Felt,
  Address,
  Class,
  Storage,
  // Serde
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
  // Crypto
  isNativeAvailable,
  isWasmAvailable,
  isWasmLoaded,
  loadWasmCrypto,
  pedersenHash,
  poseidonHash,
  poseidonHashMany,
  snKeccak,
  feltAdd,
  feltSub,
  feltMul,
  feltDiv,
  feltNeg,
  feltInverse,
  feltPow,
  feltSqrt,
  sign,
  verify,
  getPublicKey,
  recover,
  Pedersen,
  Poseidon,
  StarkCurve,
} satisfies _KunderaAPI;

// Use the validator to ensure we don't miss exports
void _wasmAPI;
