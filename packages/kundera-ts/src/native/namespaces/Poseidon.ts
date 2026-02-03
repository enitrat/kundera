/**
 * Poseidon Namespace (Native)
 *
 * Namespace object for Poseidon hash operations using native FFI.
 */

import { poseidonHash, poseidonHashMany } from '../crypto.js';

export const Poseidon = {
  hash: poseidonHash,
  hashMany: poseidonHashMany,
} as const;
