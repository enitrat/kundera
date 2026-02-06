export type { PedersenHash } from "./types.js";
export { hash, hashMany } from "./hash.js";

import { hash, hashMany } from "./hash.js";

export const Pedersen = {
	hash,
	hashMany,
} as const;
