import { Signature } from '@scure/starknet';
import { Felt252, toBigIntInternal } from '../../primitives/Felt252/index.js';
import { feltToHex64, hexToBytes } from './utils.js';

/**
 * Recover public key from signature (pure JS)
 *
 * Uses @scure/starknet Signature.recoverPublicKey.
 * Returns the X-coordinate of the recovered public key (Starknet convention).
 *
 * @param {import('../../primitives/index.js').Felt252Type} messageHash - Message hash
 * @param {import('../../primitives/index.js').Felt252Type} r - Signature r component
 * @param {import('../../primitives/index.js').Felt252Type} s - Signature s component
 * @param {import('../../primitives/index.js').Felt252Type} v - Recovery parameter (0 or 1)
 * @returns {import('../../primitives/index.js').Felt252Type} Recovered public key (x-coordinate)
 * @throws {Error} If recovery fails
 */
export function recover(messageHash, r, s, v) {
  const rBigInt = toBigIntInternal(r);
  const sBigInt = toBigIntInternal(s);
  const vNum = Number(toBigIntInternal(v));

  if (vNum !== 0 && vNum !== 1) {
    throw new Error(`Invalid recovery parameter v: ${vNum} (expected 0 or 1)`);
  }

  const msgHex = feltToHex64(messageHash);
  const msgBytes = hexToBytes(msgHex);

  const sig = new Signature(rBigInt, sBigInt);
  const sigWithRecovery = sig.addRecoveryBit(vNum);
  const recoveredPoint = sigWithRecovery.recoverPublicKey(msgBytes);
  const recoveredAffine = recoveredPoint.toAffine();

  return Felt252(recoveredAffine.x);
}
