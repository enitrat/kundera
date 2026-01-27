/**
 * Kundera - Starknet Primitives Library
 *
 * A high-performance library for Starknet types and cryptography.
 * Architecture: TypeScript API → Zig Core → Rust FFI (starknet-crypto)
 *
 * @packageDocumentation
 */

import type { KunderaAPI } from './api-interface.js';

// Re-export all primitives (base types)
export * from './primitives/index.js';

// Re-export crypto (includes merged Felt namespace with arithmetic)
// Note: This shadows the Felt from primitives with an extended version
export {
  // Availability checks
  isNativeAvailable,
  isWasmAvailable,
  isWasmLoaded,
  loadWasmCrypto,
  // Hashing
  pedersenHash,
  poseidonHash,
  poseidonHashMany,
  snKeccak,
  // Felt arithmetic
  feltAdd,
  feltSub,
  feltMul,
  feltDiv,
  feltNeg,
  feltInverse,
  feltPow,
  feltSqrt,
  // ECDSA
  sign,
  verify,
  getPublicKey,
  recover,
  // Namespaces
  Pedersen,
  Poseidon,
  Felt,
  StarkCurve,
  // Types
  type Signature,
} from './crypto/index.js';

// Re-export serde
export * from './serde/index.js';

// Re-export JSON-RPC client (class + factories only; types in 'kundera/rpc')
export {
  StarknetRpcClient,
  createClient,
  mainnet,
  sepolia,
  type RpcClientConfig,
} from './rpc/index.js';

// Re-export provider (HTTP + WebSocket providers, TypedProvider)
export * from './provider/index.js';

// ============ API Parity Check ============

import {
  FIELD_PRIME,
  MAX_CONTRACT_ADDRESS,
  Felt252,
  fromHex,
  fromBigInt,
  fromBytes,
  toHex,
  toBigInt,
  isValid,
  isZero,
  equals,
  ContractAddress,
  ContractAddressUnchecked,
  isValidContractAddress,
  ClassHash,
  ClassHashUnchecked,
  StorageKey,
  StorageKeyUnchecked,
  Address,
  Class,
  Storage,
} from './primitives/index.js';

import {
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
  Felt as CryptoFelt,
  StarkCurve,
} from './crypto/index.js';

import {
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
} from './serde/index.js';

import {
  StarknetRpcClient,
  createClient,
  mainnet,
  sepolia,
} from './rpc/index.js';

const _api = {
  // Primitives
  FIELD_PRIME,
  MAX_CONTRACT_ADDRESS,
  Felt252,
  fromHex,
  fromBigInt,
  fromBytes,
  toHex,
  toBigInt,
  isValid,
  isZero,
  equals,
  ContractAddress,
  ContractAddressUnchecked,
  isValidContractAddress,
  ClassHash,
  ClassHashUnchecked,
  StorageKey,
  StorageKeyUnchecked,
  Address,
  Class,
  Storage,
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
  Felt: CryptoFelt,
  StarkCurve,
  // Serde
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
  // RPC
  StarknetRpcClient,
  createClient,
  mainnet,
  sepolia,
} satisfies KunderaAPI;
