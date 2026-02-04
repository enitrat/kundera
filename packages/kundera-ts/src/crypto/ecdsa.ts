/**
 * ECDSA Functions
 */

import type { Felt252Type } from '../primitives/index.js';
import { withCrypto } from './helpers.js';

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
  native: (n, privateKey, messageHash) => n.sign(privateKey, messageHash),
  wasm: (w, privateKey, messageHash) => w.wasmSign(privateKey, messageHash),
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
