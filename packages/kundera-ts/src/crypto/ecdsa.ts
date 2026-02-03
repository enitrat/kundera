/**
 * ECDSA Functions
 */

import { Felt252, type Felt252Type } from '../primitives/index.js';
import { getNative, getWasm } from './state.js';

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
