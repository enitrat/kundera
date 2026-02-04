import { encodeShortString } from './encodeShortString.js';

/**
 * Encode a short string to hex
 *
 * @param str - ASCII string (max 31 characters)
 * @returns Hex-encoded felt representation (unpadded)
 */
export function encodeShortStringHex(str: string): string {
  const felt = encodeShortString(str);
  return '0x' + felt.toBigInt().toString(16);
}
