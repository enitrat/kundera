export type { PoseidonHash } from "./types.js";
export { hash, hashMany } from "./hash.js";

import { hash, hashMany } from "./hash.js";

export const Poseidon = {
	hash,
	hashMany,
} as const;
