import {
  isNativeAvailable,
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
  hashTipAndResourceBounds as hashTipAndResourceBoundsBase,
  encodeDAModes as encodeDAModesBase,
  hashCalldata as hashCalldataBase,
  computeInvokeV3Hash as computeInvokeV3HashBase,
  computeDeclareV3Hash as computeDeclareV3HashBase,
  computeDeployAccountV3Hash as computeDeployAccountV3HashBase,
  computeContractAddress as computeContractAddressBase,
  computeSelector as computeSelectorBase,
  signRaw as signRawBase,
  signTypedData as signTypedDataBase,
  hashTypedData as hashTypedDataBase,
  TRANSACTION_VERSION,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_HASH_PREFIX,
  signatureToArray,
  EXECUTE_SELECTOR
} from "kundera-sn/crypto";
import type {
  Signature,
  ResourceBounds,
  ResourceBoundsMapping,
  DataAvailabilityMode,
  V3TransactionCommon,
  InvokeTransactionV3,
  SignedInvokeTransactionV3,
  DeclareTransactionV3,
  SignedDeclareTransactionV3,
  DeployAccountTransactionV3,
  SignedDeployAccountTransactionV3,
  Call,
  UniversalDetails,
  DeclarePayload,
  DeployAccountPayload,
  ExecuteResult,
  DeclareResult,
  DeployAccountResult,
  TypedDataDomain,
  TypedDataType,
  TypedData,
  SignatureArray
} from "kundera-sn/crypto";
import type { Felt252Input, Felt252Type } from "kundera-sn/primitives";
import { tryCrypto, tryCryptoPromise } from "./utils.js";
export { CryptoError } from "../errors.js";

export type {
  Signature,
  ResourceBounds,
  ResourceBoundsMapping,
  DataAvailabilityMode,
  V3TransactionCommon,
  InvokeTransactionV3,
  SignedInvokeTransactionV3,
  DeclareTransactionV3,
  SignedDeclareTransactionV3,
  DeployAccountTransactionV3,
  SignedDeployAccountTransactionV3,
  Call,
  UniversalDetails,
  DeclarePayload,
  DeployAccountPayload,
  ExecuteResult,
  DeclareResult,
  DeployAccountResult,
  TypedDataDomain,
  TypedDataType,
  TypedData,
  SignatureArray
};

export {
  TRANSACTION_VERSION,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_HASH_PREFIX,
  signatureToArray,
  EXECUTE_SELECTOR
};

export { isNativeAvailable, isWasmAvailable, isWasmLoaded };

export const loadWasmCrypto = () =>
  tryCryptoPromise("loadWasmCrypto", null, "WASM loader available", () =>
    loadWasmCryptoBase()
  );

export const pedersenHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("pedersenHash", { a, b }, "native or wasm backend loaded", () =>
    pedersenHashBase(a, b)
  );

export const poseidonHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("poseidonHash", { a, b }, "native or wasm backend loaded", () =>
    poseidonHashBase(a, b)
  );

export const poseidonHashMany = (inputs: Felt252Type[]) =>
  tryCrypto(
    "poseidonHashMany",
    { inputs },
    "native or wasm backend loaded",
    () => poseidonHashManyBase(inputs)
  );

export const snKeccak = (data: Uint8Array | string) =>
  tryCrypto("snKeccak", { data }, "native or wasm backend loaded", () =>
    snKeccakBase(data)
  );

export const feltAdd = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("feltAdd", { a, b }, "native or wasm backend loaded", () =>
    feltAddBase(a, b)
  );

export const feltSub = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("feltSub", { a, b }, "native or wasm backend loaded", () =>
    feltSubBase(a, b)
  );

export const feltMul = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("feltMul", { a, b }, "native or wasm backend loaded", () =>
    feltMulBase(a, b)
  );

export const feltDiv = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("feltDiv", { a, b }, "native or wasm backend loaded", () =>
    feltDivBase(a, b)
  );

export const feltNeg = (a: Felt252Type) =>
  tryCrypto("feltNeg", { a }, "native or wasm backend loaded", () =>
    feltNegBase(a)
  );

export const feltInverse = (a: Felt252Type) =>
  tryCrypto("feltInverse", { a }, "native or wasm backend loaded", () =>
    feltInverseBase(a)
  );

export const feltPow = (base: Felt252Type, exp: Felt252Type) =>
  tryCrypto("feltPow", { base, exp }, "native or wasm backend loaded", () =>
    feltPowBase(base, exp)
  );

export const feltSqrt = (a: Felt252Type) =>
  tryCrypto("feltSqrt", { a }, "native or wasm backend loaded", () =>
    feltSqrtBase(a)
  );

export const sign = (privateKey: Felt252Type, messageHash: Felt252Type) =>
  tryCrypto(
    "sign",
    { privateKey, messageHash },
    "native or wasm backend loaded",
    () => signBase(privateKey, messageHash)
  );

export const verify = (
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  signature: Signature
) =>
  tryCrypto(
    "verify",
    { publicKey, messageHash, signature },
    "native or wasm backend loaded",
    () => verifyBase(publicKey, messageHash, signature)
  );

export const getPublicKey = (privateKey: Felt252Type) =>
  tryCrypto(
    "getPublicKey",
    { privateKey },
    "native or wasm backend loaded",
    () => getPublicKeyBase(privateKey)
  );

export const recover = (
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
) =>
  tryCrypto(
    "recover",
    { messageHash, r, s, v },
    "native or wasm backend loaded",
    () => recoverBase(messageHash, r, s, v)
  );

export const hashTipAndResourceBounds = (
  tip: bigint,
  resourceBounds: ResourceBoundsMapping
) =>
  tryCrypto(
    "hashTipAndResourceBounds",
    { tip, resourceBounds },
    "valid resource bounds",
    () => hashTipAndResourceBoundsBase(tip, resourceBounds)
  );

export const encodeDAModes = (
  nonceMode: DataAvailabilityMode,
  feeMode: DataAvailabilityMode
) =>
  tryCrypto("encodeDAModes", { nonceMode, feeMode }, "valid DA mode", () =>
    encodeDAModesBase(nonceMode, feeMode)
  );

export const hashCalldata = (calldata: bigint[]) =>
  tryCrypto("hashCalldata", { calldata }, "valid calldata", () =>
    hashCalldataBase(calldata)
  );

export const computeInvokeV3Hash = (
  payload: InvokeTransactionV3,
  chainId: Felt252Input
) =>
  tryCrypto(
    "computeInvokeV3Hash",
    { payload, chainId },
    "valid invoke payload",
    () => computeInvokeV3HashBase(payload, chainId)
  );

export const computeDeclareV3Hash = (
  payload: DeclareTransactionV3,
  chainId: Felt252Input
) =>
  tryCrypto(
    "computeDeclareV3Hash",
    { payload, chainId },
    "valid declare payload",
    () => computeDeclareV3HashBase(payload, chainId)
  );

export const computeDeployAccountV3Hash = (
  payload: DeployAccountTransactionV3,
  contractAddress: Felt252Input,
  chainId: Felt252Input
) =>
  tryCrypto(
    "computeDeployAccountV3Hash",
    { payload, contractAddress, chainId },
    "valid deploy account payload",
    () => computeDeployAccountV3HashBase(payload, contractAddress, chainId)
  );

export const computeContractAddress = (
  classHash: Felt252Input,
  salt: Felt252Input,
  constructorCalldata: bigint[],
  deployerAddress?: Felt252Input
) =>
  tryCrypto(
    "computeContractAddress",
    { salt, classHash, constructorCalldata, deployerAddress },
    "valid deploy parameters",
    () =>
      computeContractAddressBase(
        classHash,
        salt,
        constructorCalldata,
        deployerAddress
      )
  );

export const computeSelector = (name: string) =>
  tryCrypto("computeSelector", { name }, "valid selector name", () =>
    computeSelectorBase(name)
  );

export const signRaw = (privateKey: Felt252Type, hash: Felt252Type) =>
  tryCrypto(
    "signRaw",
    { privateKey, hash },
    "native or wasm backend loaded",
    () => signRawBase(privateKey, hash)
  );

export const signTypedData = (
  privateKey: Felt252Type,
  typedData: TypedData,
  accountAddress: string
) =>
  tryCrypto(
    "signTypedData",
    { privateKey, typedData, accountAddress },
    "native or wasm backend loaded",
    () => signTypedDataBase(privateKey, typedData, accountAddress)
  );

export const hashTypedData = (typedData: TypedData, accountAddress: string) =>
  tryCrypto(
    "hashTypedData",
    { typedData, accountAddress },
    "valid typed data",
    () => hashTypedDataBase(typedData, accountAddress)
  );

export const Pedersen = {
  hash: pedersenHash
} as const;

export const Poseidon = {
  hash: poseidonHash,
  hashMany: poseidonHashMany
} as const;

export const Felt = {
  add: feltAdd,
  sub: feltSub,
  mul: feltMul,
  div: feltDiv,
  neg: feltNeg,
  inverse: feltInverse,
  pow: feltPow,
  sqrt: feltSqrt
} as const;

export const StarkCurve = {
  sign,
  verify,
  getPublicKey,
  recover
} as const;
