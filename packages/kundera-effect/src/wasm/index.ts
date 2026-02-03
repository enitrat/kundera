import type { Felt252Type, Felt252Input } from "@kundera-sn/kundera-ts/Felt252";
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
  isWasmAvailable as isWasmAvailableBase,
  isWasmLoaded,
  getWasmPath,
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
} from "@kundera-sn/kundera-ts/wasm";
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
  isWasmLoaded,
  getWasmPath
};

export type { Felt252Type, Felt252Input } from "@kundera-sn/kundera-ts/Felt252";
export type {
  Signature,
  ContractAddressType,
  ClassHashType,
  StorageKeyType,
  EthAddressType
} from "@kundera-sn/kundera-ts/wasm";

export const loadWasmCrypto = () =>
  tryCryptoPromise("wasm.loadWasmCrypto", null, "wasm loader available", () =>
    loadWasmCryptoBase()
  );

export const isWasmAvailable = (): boolean => {
  try {
    return isWasmAvailableBase();
  } catch {
    return false;
  }
};

export const pedersenHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm.pedersenHash", { a, b }, "wasm loaded", () =>
    pedersenHashBase(a, b)
  );

export const poseidonHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm.poseidonHash", { a, b }, "wasm loaded", () =>
    poseidonHashBase(a, b)
  );

export const poseidonHashMany = (inputs: Felt252Type[]) =>
  tryCrypto("wasm.poseidonHashMany", { inputs }, "wasm loaded", () =>
    poseidonHashManyBase(inputs)
  );

export const snKeccak = (data: Uint8Array) =>
  tryCrypto("wasm.snKeccak", { data }, "wasm loaded", () => snKeccakBase(data));

export const feltAdd = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm.feltAdd", { a, b }, "wasm loaded", () =>
    feltAddBase(a, b)
  );

export const feltSub = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm.feltSub", { a, b }, "wasm loaded", () =>
    feltSubBase(a, b)
  );

export const feltMul = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm.feltMul", { a, b }, "wasm loaded", () =>
    feltMulBase(a, b)
  );

export const feltDiv = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm.feltDiv", { a, b }, "wasm loaded", () =>
    feltDivBase(a, b)
  );

export const feltNeg = (a: Felt252Type) =>
  tryCrypto("wasm.feltNeg", { a }, "wasm loaded", () =>
    feltNegBase(a)
  );

export const feltInverse = (a: Felt252Type) =>
  tryCrypto("wasm.feltInverse", { a }, "wasm loaded", () =>
    feltInverseBase(a)
  );

export const feltPow = (base: Felt252Type, exp: Felt252Type) =>
  tryCrypto("wasm.feltPow", { base, exp }, "wasm loaded", () =>
    feltPowBase(base, exp)
  );

export const feltSqrt = (a: Felt252Type) =>
  tryCrypto("wasm.feltSqrt", { a }, "wasm loaded", () =>
    feltSqrtBase(a)
  );

export const sign = (privateKey: Felt252Type, messageHash: Felt252Type) =>
  tryCrypto("wasm.sign", { privateKey, messageHash }, "wasm loaded", () =>
    signBase(privateKey, messageHash)
  );

export const verify = (
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  signature: Signature
) =>
  tryCrypto(
    "wasm.verify",
    { publicKey, messageHash, signature },
    "wasm loaded",
    () => verifyBase(publicKey, messageHash, signature)
  );

export const getPublicKey = (privateKey: Felt252Type) =>
  tryCrypto("wasm.getPublicKey", { privateKey }, "wasm loaded", () =>
    getPublicKeyBase(privateKey)
  );

export const recover = (
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
) =>
  tryCrypto(
    "wasm.recover",
    { messageHash, r, s, v },
    "wasm loaded",
    () => recoverBase(messageHash, r, s, v)
  );
