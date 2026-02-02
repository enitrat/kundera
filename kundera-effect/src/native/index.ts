import type { Felt252Type, Felt252Input } from "kundera-sn/primitives";
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
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
  isNativeAvailable,
  getNativeLibraryPath,
  StarkResult,
  isWasmAvailable,
  isWasmLoaded,
  loadWasmCrypto as loadWasmCryptoBase,
  pedersenHash as pedersenHashBase,
  poseidonHash as poseidonHashBase,
  poseidonHashMany as poseidonHashManyBase,
  snKeccak as snKeccakBase,
  feltAdd as feltAddBase,
  feltSub as feltSubBase,
  feltMul as feltMulBase,
  feltDiv as feltDivBase,
  feltNeg as feltNegBase,
  feltInverse as feltInverseBase,
  feltPow as feltPowBase,
  feltSqrt as feltSqrtBase,
  sign as signBase,
  verify as verifyBase,
  getPublicKey as getPublicKeyBase,
  recover as recoverBase,
  type Signature
} from "kundera-sn/native";
import { tryCrypto, tryCryptoPromise } from "../crypto/utils.js";
export { CryptoError } from "../errors.js";

export * from "../index.js";

export {
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
  serializeU256,
  deserializeU256,
  serializeArray,
  deserializeArray,
  serializeByteArray,
  CairoSerde,
  isNativeAvailable,
  getNativeLibraryPath,
  StarkResult,
  isWasmAvailable,
  isWasmLoaded
};

export type { Felt252Type, Felt252Input } from "kundera-sn/primitives";
export type {
  Signature,
  ContractAddressType,
  ClassHashType,
  StorageKeyType,
  EthAddressType
} from "kundera-sn/native";

export const loadWasmCrypto = () =>
  tryCryptoPromise("native.loadWasmCrypto", null, "native runtime", () =>
    loadWasmCryptoBase()
  );

export const pedersenHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("native.pedersenHash", { a, b }, "native FFI available", () =>
    pedersenHashBase(a, b)
  );

export const poseidonHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("native.poseidonHash", { a, b }, "native FFI available", () =>
    poseidonHashBase(a, b)
  );

export const poseidonHashMany = (inputs: Felt252Type[]) =>
  tryCrypto(
    "native.poseidonHashMany",
    { inputs },
    "native FFI available",
    () => poseidonHashManyBase(inputs)
  );

export const snKeccak = (data: Uint8Array | string) =>
  tryCrypto("native.snKeccak", { data }, "native FFI available", () =>
    snKeccakBase(data)
  );

export const feltAdd = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("native.feltAdd", { a, b }, "native FFI available", () =>
    feltAddBase(a, b)
  );

export const feltSub = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("native.feltSub", { a, b }, "native FFI available", () =>
    feltSubBase(a, b)
  );

export const feltMul = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("native.feltMul", { a, b }, "native FFI available", () =>
    feltMulBase(a, b)
  );

export const feltDiv = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("native.feltDiv", { a, b }, "native FFI available", () =>
    feltDivBase(a, b)
  );

export const feltNeg = (a: Felt252Type) =>
  tryCrypto("native.feltNeg", { a }, "native FFI available", () =>
    feltNegBase(a)
  );

export const feltInverse = (a: Felt252Type) =>
  tryCrypto("native.feltInverse", { a }, "native FFI available", () =>
    feltInverseBase(a)
  );

export const feltPow = (base: Felt252Type, exp: Felt252Type) =>
  tryCrypto("native.feltPow", { base, exp }, "native FFI available", () =>
    feltPowBase(base, exp)
  );

export const feltSqrt = (a: Felt252Type) =>
  tryCrypto("native.feltSqrt", { a }, "native FFI available", () =>
    feltSqrtBase(a)
  );

export const sign = (privateKey: Felt252Type, messageHash: Felt252Type) =>
  tryCrypto(
    "native.sign",
    { privateKey, messageHash },
    "native FFI available",
    () => signBase(privateKey, messageHash)
  );

export const verify = (
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  signature: Signature
) =>
  tryCrypto(
    "native.verify",
    { publicKey, messageHash, signature },
    "native FFI available",
    () => verifyBase(publicKey, messageHash, signature)
  );

export const getPublicKey = (privateKey: Felt252Type) =>
  tryCrypto("native.getPublicKey", { privateKey }, "native FFI available", () =>
    getPublicKeyBase(privateKey)
  );

export const recover = (
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
) =>
  tryCrypto(
    "native.recover",
    { messageHash, r, s, v },
    "native FFI available",
    () => recoverBase(messageHash, r, s, v)
  );
