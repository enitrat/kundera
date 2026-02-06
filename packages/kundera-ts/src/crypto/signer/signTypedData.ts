/**
 * Sign Typed Data
 *
 * Sign typed data (SNIP-12 / EIP-712 style) with a private key.
 */

import type { Felt252Input } from "../../primitives/index.js";
import type { Signature } from "../ecdsa.js";
import type { TypedData } from "../account-types.js";
import { signRaw } from "./signRaw.js";
import { hashTypedData } from "./hashTypedData.js";

/**
 * Sign typed data (SNIP-12 / EIP-712 style) with a private key.
 */
export function signTypedData(
	privateKey: Felt252Input,
	typedData: TypedData,
	accountAddress: string,
): Signature {
	const messageHash = hashTypedData(typedData, accountAddress);
	return signRaw(privateKey, messageHash);
}
