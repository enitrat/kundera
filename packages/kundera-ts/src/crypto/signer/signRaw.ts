/**
 * Sign Raw
 *
 * Sign a raw message hash with a private key.
 */

import { Felt252, type Felt252Input } from "../../primitives/index.js";
import { type Signature, sign as signPrimitive } from "../ecdsa.js";

/**
 * Sign a raw message hash with a private key.
 */
export function signRaw(
	privateKey: Felt252Input,
	hash: Felt252Input,
): Signature {
	return signPrimitive(Felt252(privateKey), Felt252(hash));
}
