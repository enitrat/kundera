import { encodeShortString } from "./encodeShortString.js";

/**
 * Encode a short string to hex
 *
 * @param {string} str - ASCII string (max 31 characters)
 * @returns {string} Hex-encoded felt representation (unpadded)
 */
export function encodeShortStringHex(str) {
	const felt = encodeShortString(str);
	return `0x${felt.toBigInt().toString(16)}`;
}
