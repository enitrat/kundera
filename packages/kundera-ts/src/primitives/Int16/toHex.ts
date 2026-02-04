import type { Int16Type } from './types.js';

/**
 * Convert an Int16 to its hexadecimal string representation.
 *
 * For negative values, returns a string with a minus sign prefix
 * followed by 0x and the absolute value in hex.
 *
 * @param value - The Int16 to convert
 * @returns Hexadecimal string (e.g., "0xff" or "-0x1")
 */
export function toHex(value: Int16Type): string {
  const bigintValue = value as bigint;

  if (bigintValue < 0n) {
    return '-0x' + (-bigintValue).toString(16);
  }

  return '0x' + bigintValue.toString(16);
}
