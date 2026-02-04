/**
 * Starknet Crypto
 *
 * Cryptographic operations for Starknet.
 * Priority: Native FFI (Bun) -> WASM -> throw
 */

import type { Felt252Type } from '../primitives/index.js';

// ============ Backend Detection ============

// Global singleton to share WASM state across all module instances
// This fixes the ESM module duplication issue where different imports
// of this module would have separate state variables.
const KUNDERA_CRYPTO_STATE = Symbol.for('kundera-crypto-state');
interface CryptoState {
  native: typeof import('../native/index.js') | null;
  nativeChecked: boolean;
  wasm: typeof import('../wasm-loader/index.js') | null;
  wasmChecked: boolean;
  wasmLoaded: boolean;
}
const state: CryptoState = (globalThis as any)[KUNDERA_CRYPTO_STATE] ??= {
  native: null,
  nativeChecked: false,
  wasm: null,
  wasmChecked: false,
  wasmLoaded: false,
};

function tryRequire(path: string): any | null {
  const req = (globalThis as { require?: (id: string) => any }).require;
  if (typeof req !== 'function') return null;
  return req(path);
}

/**
 * Check and load native FFI if available (Bun only)
 */
function getNative(): CryptoState['native'] {
  if (!state.nativeChecked) {
    state.nativeChecked = true;
    try {
      const hasBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined';
      if (hasBun) {
        state.native = tryRequire('../native/index.js');
        if (!state.native?.isNativeAvailable()) {
          state.native = null;
        }
      }
    } catch {
      state.native = null;
    }
  }
  return state.native;
}

/**
 * Get WASM module (must be loaded first via loadWasmCrypto)
 */
function getWasmModule(): CryptoState['wasm'] {
  if (!state.wasmChecked) {
    state.wasmChecked = true;
    try {
      state.wasm = tryRequire('../wasm-loader/index.js');
    } catch {
      state.wasm = null;
    }
  }
  return state.wasm;
}

function getWasm(): CryptoState['wasm'] | null {
  const w = getWasmModule();
  return state.wasmLoaded ? w : null;
}

// ============ Local withCrypto helper ============
// Uses the local getNative/getWasm which access the global singleton state

/**
 * Higher-order function that handles native/wasm fallback pattern.
 * Local version that uses the module's getNative/getWasm functions.
 */
function withCrypto<Args extends any[], R>(operation: {
  native: (impl: NonNullable<ReturnType<typeof getNative>>, ...args: Args) => R;
  wasm: (impl: NonNullable<ReturnType<typeof getWasm>>, ...args: Args) => R;
}): (...args: Args) => R {
  return (...args: Args) => {
    const n = getNative();
    if (n) return operation.native(n, ...args);

    const w = getWasm();
    if (w) return operation.wasm(w, ...args);

    throw new Error('Crypto backend not initialized - call loadWasmCrypto() first or use Bun runtime');
  };
}

// ============ Initialization ============

/**
 * Check if native crypto is available
 */
export function isNativeAvailable(): boolean {
  return getNative() !== null;
}

/**
 * Check if WASM crypto is available (file exists)
 */
export function isWasmAvailable(): boolean {
  const w = getWasmModule();
  return w?.isWasmAvailable() ?? false;
}

/**
 * Check if WASM crypto is loaded
 */
export function isWasmLoaded(): boolean {
  return state.wasmLoaded;
}

/**
 * Load WASM crypto module
 * Call this before using crypto functions if native is not available.
 */
export async function loadWasmCrypto(): Promise<void> {
  if (state.wasmLoaded) return;

  let w = getWasmModule();
  if (!w) {
    try {
      w = await import('../wasm-loader/index.js');
      state.wasm = w;
      state.wasmChecked = true;
    } catch {
      throw new Error('WASM loader not available');
    }
  }

  await w.loadWasmCrypto();
  state.wasmLoaded = true;
}

// ============ Hashing ============

/**
 * Pedersen hash of two felts
 */
export const pedersenHash = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => n.pedersenHash(a, b),
  wasm: (w, a, b) => w.wasmPedersenHash(a, b),
});

/**
 * Poseidon hash of two felts
 */
export const poseidonHash = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => n.poseidonHash(a, b),
  wasm: (w, a, b) => w.wasmPoseidonHash(a, b),
});

/**
 * Poseidon hash of multiple felts
 */
export const poseidonHashMany = withCrypto<[Felt252Type[]], Felt252Type>({
  native: (n, inputs) => n.poseidonHashMany(inputs),
  wasm: (w, inputs) => w.wasmPoseidonHashMany(inputs),
});

/**
 * sn_keccak - Truncated Keccak256 (first 250 bits)
 *
 * Computes keccak256(data) and masks to 250 bits for use as Starknet selector.
 */
export function snKeccak(data: Uint8Array | string): Felt252Type {
  // Convert string to bytes if needed
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return snKeccakBytes(bytes);
}

const snKeccakBytes = withCrypto<[Uint8Array], Felt252Type>({
  native: (n, bytes) => n.snKeccak(bytes),
  wasm: (w, bytes) => w.wasmKeccak256(bytes),
});

// ============ Felt Arithmetic ============

/**
 * Add two felts (a + b mod P)
 */
export const feltAdd = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => n.feltAdd(a, b),
  wasm: (w, a, b) => w.wasmFeltAdd(a, b),
});

/**
 * Subtract two felts (a - b mod P)
 */
export const feltSub = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => n.feltSub(a, b),
  wasm: (w, a, b) => w.wasmFeltSub(a, b),
});

/**
 * Multiply two felts (a * b mod P)
 */
export const feltMul = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => n.feltMul(a, b),
  wasm: (w, a, b) => w.wasmFeltMul(a, b),
});

/**
 * Divide two felts (a / b mod P)
 */
export const feltDiv = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, a, b) => n.feltDiv(a, b),
  wasm: (w, a, b) => w.wasmFeltDiv(a, b),
});

/**
 * Negate a felt (-a mod P)
 */
export const feltNeg = withCrypto<[Felt252Type], Felt252Type>({
  native: (n, a) => n.feltNeg(a),
  wasm: (w, a) => w.wasmFeltNeg(a),
});

/**
 * Multiplicative inverse (1/a mod P)
 */
export const feltInverse = withCrypto<[Felt252Type], Felt252Type>({
  native: (n, a) => n.feltInverse(a),
  wasm: (w, a) => w.wasmFeltInverse(a),
});

/**
 * Power (base^exp mod P)
 */
export const feltPow = withCrypto<[Felt252Type, Felt252Type], Felt252Type>({
  native: (n, base, exp) => n.feltPow(base, exp),
  wasm: (w, base, exp) => w.wasmFeltPow(base, exp),
});

/**
 * Square root (returns sqrt if exists)
 */
export const feltSqrt = withCrypto<[Felt252Type], Felt252Type>({
  native: (n, a) => n.feltSqrt(a),
  wasm: (w, a) => w.wasmFeltSqrt(a),
});

// ============ ECDSA ============

/**
 * STARK curve signature
 */
export interface Signature {
  r: Felt252Type;
  s: Felt252Type;
}

/**
 * Sign a message with STARK curve ECDSA
 */
export const sign = withCrypto<[Felt252Type, Felt252Type], Signature>({
  native: (n, privateKey, messageHash) => {
    const sig = n.sign(privateKey, messageHash);
    return { r: sig.r, s: sig.s };
  },
  wasm: (w, privateKey, messageHash) => {
    const sig = w.wasmSign(privateKey, messageHash);
    return { r: sig.r, s: sig.s };
  },
});

/**
 * Verify a STARK curve ECDSA signature
 */
export const verify = withCrypto<[Felt252Type, Felt252Type, Signature], boolean>({
  native: (n, publicKey, messageHash, signature) =>
    n.verify(publicKey, messageHash, signature),
  wasm: (w, publicKey, messageHash, signature) =>
    w.wasmVerify(publicKey, messageHash, signature.r, signature.s),
});

/**
 * Get public key from private key
 */
export const getPublicKey = withCrypto<[Felt252Type], Felt252Type>({
  native: (n, privateKey) => n.getPublicKey(privateKey),
  wasm: (w, privateKey) => w.wasmGetPublicKey(privateKey),
});

/**
 * Recover public key from signature
 */
export const recover = withCrypto<
  [Felt252Type, Felt252Type, Felt252Type, Felt252Type],
  Felt252Type
>({
  native: (n, messageHash, r, s, v) => n.recover(messageHash, r, s, v),
  wasm: (w, messageHash, r, s, v) => w.wasmRecover(messageHash, r, s, v),
});

// ============ Namespace exports ============

export const Pedersen = {
  hash: pedersenHash,
} as const;

export const Poseidon = {
  hash: poseidonHash,
  hashMany: poseidonHashMany,
} as const;

// Merge primitive Felt namespace with arithmetic ops (preserve call signature)
import { Felt as FeltPrimitives } from '../primitives/index.js';

const FeltBase = ((
  value: Parameters<typeof FeltPrimitives>[0],
) => FeltPrimitives(value)) as typeof FeltPrimitives;

export const Felt = Object.assign(FeltBase, FeltPrimitives, {
  add: feltAdd,
  sub: feltSub,
  mul: feltMul,
  div: feltDiv,
  neg: feltNeg,
  inverse: feltInverse,
  pow: feltPow,
  sqrt: feltSqrt,
}) as typeof FeltPrimitives & {
  add: typeof feltAdd;
  sub: typeof feltSub;
  mul: typeof feltMul;
  div: typeof feltDiv;
  neg: typeof feltNeg;
  inverse: typeof feltInverse;
  pow: typeof feltPow;
  sqrt: typeof feltSqrt;
};

export const StarkCurve = {
  sign,
  verify,
  getPublicKey,
  recover,
} as const;

// ============ Account Hash + Types ============

export type {
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
  SignatureArray,
} from './account-types.js';

export {
  TRANSACTION_VERSION,
  DEFAULT_RESOURCE_BOUNDS,
  TRANSACTION_HASH_PREFIX,
  signatureToArray,
} from './account-types.js';

export {
  hashTipAndResourceBounds,
  encodeDAModes,
  hashCalldata,
  computeInvokeV3Hash,
  computeDeclareV3Hash,
  computeDeployAccountV3Hash,
  computeContractAddress,
  computeSelector,
  EXECUTE_SELECTOR,
} from './account-hash.js';

export { signRaw, signTypedData, hashTypedData } from './signer.js';
