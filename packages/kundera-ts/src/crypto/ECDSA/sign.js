import { sign as scureSign } from "@scure/starknet";
import { Felt252 } from "../../primitives/Felt252/index.js";
import { feltToHex64 } from "./utils.js";

/**
 * Sign a message hash with STARK curve ECDSA (pure JS)
 *
 * @param {import('../../primitives/index.js').Felt252Type} privateKey - Private key
 * @param {import('../../primitives/index.js').Felt252Type} messageHash - Message hash to sign
 * @returns {import('./types.js').Signature} Signature with r and s components
 */
export function sign(privateKey, messageHash) {
	const sig = scureSign(feltToHex64(messageHash), feltToHex64(privateKey));

	return /** @type {import('./types.js').Signature} */ ({
		r: Felt252(sig.r),
		s: Felt252(sig.s),
		// Store the original Signature for verify compatibility
		_raw: sig,
	});
}
