/**
 * StarkCurve Namespace
 *
 * Namespace object for ECDSA operations on the Stark curve.
 */

import { sign, verify, getPublicKey, recover } from '../ECDSA/index.js';

export const StarkCurve = {
  sign,
  verify,
  getPublicKey,
  recover,
} as const;
