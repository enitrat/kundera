import { getPublicKey as scureGetPublicKey } from "@scure/starknet";
import { Felt252 } from "../../primitives/Felt252/index.js";
import { feltToHex64 } from "./utils.js";

/**
 * Derive public key from private key (pure JS)
 *
 * Returns the X-coordinate of the public key point (Starknet convention).
 *
 * @param {import('../../primitives/index.js').Felt252Type} privateKey - Private key
 * @returns {import('../../primitives/index.js').Felt252Type} Public key (x-coordinate)
 */
export function getPublicKey(privateKey) {
	// getPublicKey returns uncompressed point: 0x04 || X (32 bytes) || Y (32 bytes)
	const pubKeyBytes = scureGetPublicKey(feltToHex64(privateKey));
	// Extract X-coordinate (bytes 1-32, skipping the 0x04 prefix)
	const xCoord = pubKeyBytes.slice(1, 33);
	return Felt252(xCoord);
}

/**
 * Derive full uncompressed public key from private key (pure JS)
 *
 * Returns the full 65-byte uncompressed public key (0x04 || X || Y).
 * Use this for ECDSA verification.
 *
 * @param {import('../../primitives/index.js').Felt252Type} privateKey - Private key
 * @returns {Uint8Array} Full uncompressed public key (65 bytes)
 */
export function getPublicKeyFull(privateKey) {
	const pubKey = scureGetPublicKey(feltToHex64(privateKey));
	// Ensure we return a fresh Uint8Array to avoid cross-module issues
	return new Uint8Array(pubKey);
}
