import type { Felt252Type } from "../../primitives/index.js";

/**
 * STARK curve ECDSA signature
 */
export interface Signature {
	readonly r: Felt252Type;
	readonly s: Felt252Type;
}
