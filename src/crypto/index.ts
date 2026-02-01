/**
 * Starknet Crypto
 *
 * Cryptographic operations for Starknet.
 * Priority: Native FFI (Bun) → WASM → throw
 */

import { Felt252, type Felt252Type } from '../primitives/index.js';

// ============ Backend Detection ============

// Native FFI (Bun only)
let native: typeof import('../native/index.js') | null = null;
let nativeChecked = false;

// WASM loader
let wasm: typeof import('../wasm-loader/index.js') | null = null;
let wasmChecked = false;
let wasmLoaded = false;

function tryRequire(path: string): any | null {
  const req = (globalThis as { require?: (id: string) => any }).require;
  if (typeof req !== 'function') return null;
  return req(path);
}

/**
 * Check and load native FFI if available (Bun only)
 */
function getNative(): typeof native {
  if (!nativeChecked) {
    nativeChecked = true;
    try {
      const hasBun = typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined';
      if (hasBun) {
        native = tryRequire('../native/index.js');
        if (!native?.isNativeAvailable()) {
          native = null;
        }
      }
    } catch {
      native = null;
    }
  }
  return native;
}

/**
 * Get WASM module (must be loaded first via loadWasmCrypto)
 */
function getWasmModule(): typeof wasm {
  if (!wasmChecked) {
    wasmChecked = true;
    try {
      wasm = tryRequire('../wasm-loader/index.js');
    } catch {
      wasm = null;
    }
  }
  return wasm;
}

function getWasm(): typeof wasm | null {
  const w = getWasmModule();
  return wasmLoaded ? w : null;
}

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
  return wasmLoaded;
}

/**
 * Load WASM crypto module
 * Call this before using crypto functions if native is not available.
 */
export async function loadWasmCrypto(): Promise<void> {
  if (wasmLoaded) return;

  let w = getWasmModule();
  if (!w) {
    try {
      w = await import('../wasm-loader/index.js');
      wasm = w;
      wasmChecked = true;
    } catch {
      throw new Error('WASM loader not available');
    }
  }

  await w.loadWasmCrypto();
  wasmLoaded = true;
}

// ============ Hashing ============

/**
 * Pedersen hash of two felts
 */
export function pedersenHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.pedersenHash(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmPedersenHash(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Poseidon hash of two felts
 */
export function poseidonHash(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.poseidonHash(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmPoseidonHash(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Poseidon hash of multiple felts
 */
export function poseidonHashMany(inputs: Felt252Type[]): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.poseidonHashMany(inputs));

  const w = getWasm();
  if (w) return Felt252(w.wasmPoseidonHashMany(inputs));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * sn_keccak - Truncated Keccak256 (first 250 bits)
 *
 * Computes keccak256(data) and masks to 250 bits for use as Starknet selector.
 */
export function snKeccak(data: Uint8Array | string): Felt252Type {
  // Convert string to bytes if needed
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  const n = getNative();
  if (n) return Felt252(n.snKeccak(bytes));

  const w = getWasm();
  if (w) return Felt252(w.wasmKeccak256(bytes));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

// ============ Felt Arithmetic ============

/**
 * Add two felts (a + b mod P)
 */
export function feltAdd(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltAdd(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltAdd(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Subtract two felts (a - b mod P)
 */
export function feltSub(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltSub(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltSub(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Multiply two felts (a * b mod P)
 */
export function feltMul(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltMul(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltMul(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Divide two felts (a / b mod P)
 */
export function feltDiv(a: Felt252Type, b: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltDiv(a, b));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltDiv(a, b));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Negate a felt (-a mod P)
 */
export function feltNeg(a: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltNeg(a));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltNeg(a));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Multiplicative inverse (1/a mod P)
 */
export function feltInverse(a: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltInverse(a));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltInverse(a));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Power (base^exp mod P)
 */
export function feltPow(base: Felt252Type, exp: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltPow(base, exp));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltPow(base, exp));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Square root (returns sqrt if exists)
 */
export function feltSqrt(a: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.feltSqrt(a));

  const w = getWasm();
  if (w) return Felt252(w.wasmFeltSqrt(a));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

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
export function sign(
  privateKey: Felt252Type,
  messageHash: Felt252Type
): Signature {
  const n = getNative();
  if (n) {
    const sig = n.sign(privateKey, messageHash);
    return { r: Felt252(sig.r), s: Felt252(sig.s) };
  }

  const w = getWasm();
  if (w) {
    const sig = w.wasmSign(privateKey, messageHash);
    return { r: Felt252(sig.r), s: Felt252(sig.s) };
  }

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Verify a STARK curve ECDSA signature
 */
export function verify(
  publicKey: Felt252Type,
  messageHash: Felt252Type,
  signature: Signature
): boolean {
  const n = getNative();
  if (n) return n.verify(publicKey, messageHash, signature);

  const w = getWasm();
  if (w) return w.wasmVerify(publicKey, messageHash, signature.r, signature.s);

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Get public key from private key
 */
export function getPublicKey(privateKey: Felt252Type): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.getPublicKey(privateKey));

  const w = getWasm();
  if (w) return Felt252(w.wasmGetPublicKey(privateKey));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

/**
 * Recover public key from signature
 */
export function recover(
  messageHash: Felt252Type,
  r: Felt252Type,
  s: Felt252Type,
  v: Felt252Type
): Felt252Type {
  const n = getNative();
  if (n) return Felt252(n.recover(messageHash, r, s, v));

  const w = getWasm();
  if (w) return Felt252(w.wasmRecover(messageHash, r, s, v));

  throw new Error('Not implemented - call loadWasmCrypto() first or use Bun runtime');
}

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
  hashResourceBounds,
  encodeDAModes,
  hashCalldata,
  computeInvokeV3Hash,
  computeDeclareV3Hash,
  computeDeployAccountV3Hash,
  computeContractAddress,
  computeSelector,
  EXECUTE_SELECTOR,
} from './account-hash.js';

export type { SignerInterface } from './signer.js';
export { PrivateKeySigner, createSigner } from './signer.js';
