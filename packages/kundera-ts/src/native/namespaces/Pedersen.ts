/**
 * Pedersen Namespace (Native)
 *
 * Namespace object for Pedersen hash operations using native FFI.
 */

import { pedersenHash } from "../crypto.js";

export const Pedersen = {
	hash: pedersenHash,
} as const;
