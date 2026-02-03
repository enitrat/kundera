/**
 * Poseidon Namespace
 *
 * Namespace object for Poseidon hash operations.
 */

import { poseidonHash, poseidonHashMany } from '../hash.js';

export const Poseidon = {
  hash: poseidonHash,
  hashMany: poseidonHashMany,
} as const;
