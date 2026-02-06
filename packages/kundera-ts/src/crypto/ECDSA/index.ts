export type { Signature } from "./types.js";

export { sign } from "./sign.js";
export { verify } from "./verify.js";
export { getPublicKey, getPublicKeyFull } from "./getPublicKey.js";
export { recover } from "./recover.js";

import { sign } from "./sign.js";
import { verify } from "./verify.js";
import { getPublicKey, getPublicKeyFull } from "./getPublicKey.js";
import { recover } from "./recover.js";

/**
 * ECDSA namespace with all functions
 *
 * Pure JS implementation using @scure/starknet.
 * For native/wasm backends, import from:
 * - '@kundera-sn/kundera-ts/crypto/ECDSA/sign.native'
 * - '@kundera-sn/kundera-ts/crypto/ECDSA/sign.wasm'
 */
export const ECDSA = {
	sign,
	verify,
	getPublicKey,
	getPublicKeyFull,
	recover,
} as const;
