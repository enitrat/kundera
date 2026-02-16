/**
 * StarkCurve Namespace (Native)
 *
 * Namespace object for ECDSA operations on the Stark curve using native FFI.
 */

import { getPublicKey, recover, sign, verify } from "../crypto.js";

export const StarkCurve = {
	sign,
	verify,
	getPublicKey,
	recover,
} as const;
