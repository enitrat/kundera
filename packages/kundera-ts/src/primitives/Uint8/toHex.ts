import type { Uint8Type } from './types.js';

/**
 * Convert Uint8 to hex string
 *
 * @param uint - Uint8 value
 * @returns Hex string with 0x prefix
 */
export function toHex(uint: Uint8Type): string {
  return `0x${uint.toString(16)}`;
}
