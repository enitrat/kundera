import type { Felt252Type } from "@kundera-sn/kundera-ts/Felt252";
import {
  loadWasmCrypto as loadWasmCryptoBase,
  isWasmAvailable as isWasmAvailableBase,
  isWasmLoaded,
  getWasmPath as getWasmPathBase,
  wasmFeltAdd as wasmFeltAddBase,
  wasmFeltSub as wasmFeltSubBase,
  wasmFeltMul as wasmFeltMulBase,
  wasmFeltDiv as wasmFeltDivBase,
  wasmFeltNeg as wasmFeltNegBase,
  wasmFeltInverse as wasmFeltInverseBase,
  wasmFeltPow as wasmFeltPowBase,
  wasmFeltSqrt as wasmFeltSqrtBase,
  wasmPedersenHash as wasmPedersenHashBase,
  wasmPoseidonHash as wasmPoseidonHashBase,
  wasmPoseidonHashMany as wasmPoseidonHashManyBase,
  wasmKeccak256 as wasmKeccak256Base,
  wasmGetPublicKey as wasmGetPublicKeyBase,
  wasmSign as wasmSignBase,
  wasmVerify as wasmVerifyBase,
  wasmRecover as wasmRecoverBase,
  type WasmSignature,
  ErrorCode,
  type WasmExports,
  type WasmInstance
} from "@kundera-sn/kundera-ts/wasm-loader";
import { tryCrypto, tryCryptoPromise } from "../crypto/utils.js";

export { CryptoError } from "../errors.js";

export const isWasmAvailable = (): boolean => {
  try {
    return isWasmAvailableBase();
  } catch {
    return false;
  }
};

export const getWasmPath = (): string | null => {
  try {
    return getWasmPathBase();
  } catch {
    return null;
  }
};

export { isWasmLoaded, ErrorCode };
export type { WasmSignature, WasmExports, WasmInstance };

export const loadWasmCrypto = () =>
  tryCryptoPromise("wasm-loader.loadWasmCrypto", null, "wasm loader available", () =>
    loadWasmCryptoBase()
  );

export const wasmFeltAdd = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm-loader.wasmFeltAdd", { a, b }, "wasm loaded", () =>
    wasmFeltAddBase(a, b)
  );

export const wasmFeltSub = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm-loader.wasmFeltSub", { a, b }, "wasm loaded", () =>
    wasmFeltSubBase(a, b)
  );

export const wasmFeltMul = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm-loader.wasmFeltMul", { a, b }, "wasm loaded", () =>
    wasmFeltMulBase(a, b)
  );

export const wasmFeltDiv = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm-loader.wasmFeltDiv", { a, b }, "wasm loaded", () =>
    wasmFeltDivBase(a, b)
  );

export const wasmFeltNeg = (a: Felt252Type) =>
  tryCrypto("wasm-loader.wasmFeltNeg", { a }, "wasm loaded", () =>
    wasmFeltNegBase(a)
  );

export const wasmFeltInverse = (a: Felt252Type) =>
  tryCrypto("wasm-loader.wasmFeltInverse", { a }, "wasm loaded", () =>
    wasmFeltInverseBase(a)
  );

export const wasmFeltPow = (base: Felt252Type, exp: Felt252Type) =>
  tryCrypto("wasm-loader.wasmFeltPow", { base, exp }, "wasm loaded", () =>
    wasmFeltPowBase(base, exp)
  );

export const wasmFeltSqrt = (a: Felt252Type) =>
  tryCrypto("wasm-loader.wasmFeltSqrt", { a }, "wasm loaded", () =>
    wasmFeltSqrtBase(a)
  );

export const wasmPedersenHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm-loader.wasmPedersenHash", { a, b }, "wasm loaded", () =>
    wasmPedersenHashBase(a, b)
  );

export const wasmPoseidonHash = (a: Felt252Type, b: Felt252Type) =>
  tryCrypto("wasm-loader.wasmPoseidonHash", { a, b }, "wasm loaded", () =>
    wasmPoseidonHashBase(a, b)
  );

export const wasmPoseidonHashMany = (inputs: Felt252Type[]) =>
  tryCrypto(
    "wasm-loader.wasmPoseidonHashMany",
    { inputs },
    "wasm loaded",
    () => wasmPoseidonHashManyBase(inputs)
  );

export const wasmKeccak256 = (data: Uint8Array) =>
  tryCrypto("wasm-loader.wasmKeccak256", { data }, "wasm loaded", () =>
    wasmKeccak256Base(data)
  );

export const wasmGetPublicKey = (privateKey: Felt252Type) =>
  tryCrypto("wasm-loader.wasmGetPublicKey", { privateKey }, "wasm loaded", () =>
    wasmGetPublicKeyBase(privateKey)
  );

export const wasmSign = (privateKey: Felt252Type, messageHash: Felt252Type) =>
  tryCrypto(
    "wasm-loader.wasmSign",
    { privateKey, messageHash },
    "wasm loaded",
    () => wasmSignBase(privateKey, messageHash)
  );

export const wasmVerify = (
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type
) =>
  tryCrypto(
    "wasm-loader.wasmVerify",
    { publicKey, messageHash, r, s },
    "wasm loaded",
    () => wasmVerifyBase(publicKey, messageHash, r, s)
  );

export const wasmRecover = (
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
) =>
  tryCrypto(
    "wasm-loader.wasmRecover",
    { messageHash, r, s, v },
    "wasm loaded",
    () => wasmRecoverBase(messageHash, r, s, v)
  );
