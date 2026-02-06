export type { Keccak256Hash } from "./types.js";
export { DIGEST_SIZE } from "./constants.js";
export { hash, hashHex } from "./hash.js";

import { hash, hashHex } from "./hash.js";
import { DIGEST_SIZE } from "./constants.js";

export const Keccak256 = {
	hash,
	hashHex,
	DIGEST_SIZE,
} as const;
