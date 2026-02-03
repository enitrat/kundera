/**
 * Pedersen Namespace (WASM)
 *
 * Namespace object for Pedersen hash operations using WASM.
 */

import { pedersenHash } from '../crypto.js';

export const Pedersen = {
  hash: pedersenHash,
} as const;
