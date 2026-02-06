/**
 * StarkCurve Namespace (WASM)
 *
 * Namespace object for ECDSA operations on the Stark curve using WASM.
 */

import { sign, verify, getPublicKey, recover } from "../crypto.js";

export const StarkCurve = {
	sign,
	verify,
	getPublicKey,
	recover,
} as const;
