/**
 * Pedersen Namespace
 *
 * Namespace object for Pedersen hash operations.
 */

import { pedersenHash } from '../hash.js';

export const Pedersen = {
  hash: pedersenHash,
} as const;
