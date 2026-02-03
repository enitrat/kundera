import { encodeShortString } from './encodeShortString.js';

/**
 * Encode a short string to hex
 *
 * @param str - ASCII string (max 31 characters)
 * @returns Hex-encoded felt representation
 */
export function encodeShortStringHex(str: string): string {
  const value = encodeShortString(str);
  return '0x' + value.toString(16);
}
