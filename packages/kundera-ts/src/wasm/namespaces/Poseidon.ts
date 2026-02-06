/**
 * Poseidon Namespace (WASM)
 *
 * Namespace object for Poseidon hash operations using WASM.
 */

import { poseidonHash, poseidonHashMany } from "../crypto.js";

export const Poseidon = {
	hash: poseidonHash,
	hashMany: poseidonHashMany,
} as const;
