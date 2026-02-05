import { verify as scureVerify, Signature } from '@scure/starknet';
import { toBigIntInternal } from '../../primitives/Felt252/index.js';
import { feltToHex64, hexToBytes } from './utils.js';

/**
 * Verify a STARK curve ECDSA signature (pure JS)
 *
 * Accepts either:
 * - Full uncompressed public key (65 bytes Uint8Array)
 * - X-coordinate only (Felt252Type) - will try both Y values via recovery
 *
 * @param {Uint8Array | import('../../primitives/index.js').Felt252Type} publicKey - Public key
 * @param {import('../../primitives/index.js').Felt252Type} messageHash - Message hash that was signed
 * @param {import('./types.js').Signature & { _raw?: any }} signature - Signature to verify
 * @returns {boolean} True if signature is valid
 */
export function verify(publicKey, messageHash, signature) {
  const msgHex = feltToHex64(messageHash);
  const msgBytes = hexToBytes(msgHex);

  // Get r and s values
  const r = signature._raw?.r ?? toBigIntInternal(signature.r);
  const s = signature._raw?.s ?? toBigIntInternal(signature.s);

  // If publicKey is a Uint8Array of 65 bytes, use it directly
  if (publicKey instanceof Uint8Array && publicKey.length === 65) {
    const sig = new Signature(r, s);
    return scureVerify(sig, msgHex, publicKey);
  }

  // Otherwise, publicKey is X-coordinate only (Felt252Type)
  // Use signature recovery to find the matching public key
  const expectedX = toBigIntInternal(publicKey);

  // Try both recovery values (0 and 1)
  for (const recovery of [0, 1]) {
    try {
      const sig = new Signature(r, s);
      const testSig = sig.addRecoveryBit(recovery);
      // Use bytes for v1.x compatibility (v2.x accepts both)
      const recoveredPoint = testSig.recoverPublicKey(msgBytes);
      const recoveredAffine = recoveredPoint.toAffine();
      const recoveredX = recoveredAffine.x;

      if (recoveredX === expectedX) {
        // Found matching public key, verify with full point
        const pubKeyBytes = recoveredPoint.toBytes(false);
        return scureVerify(testSig, msgHex, pubKeyBytes);
      }
    } catch {
      // This recovery value didn't work, try next
    }
  }

  // Neither recovery value matched the expected X-coordinate
  return false;
}
