/**
 * StarkCurve Namespace (Native)
 *
 * Namespace object for ECDSA operations on the Stark curve using native FFI.
 */

import { sign, verify, getPublicKey, recover } from '../crypto.js';

export const StarkCurve = {
  sign,
  verify,
  getPublicKey,
  recover,
} as const;
