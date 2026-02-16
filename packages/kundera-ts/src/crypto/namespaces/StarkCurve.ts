/**
 * StarkCurve Namespace
 *
 * Namespace object for ECDSA operations on the Stark curve.
 */

import { getPublicKey, recover, sign, verify } from "../ECDSA/index.js";

export const StarkCurve = {
	sign,
	verify,
	getPublicKey,
	recover,
} as const;
