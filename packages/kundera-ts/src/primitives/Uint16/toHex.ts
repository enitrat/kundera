import type { Uint16Type } from './types.js';

/**
 * Convert Uint16 to hex string
 *
 * @param uint - Uint16 value
 * @returns Hex string with 0x prefix
 */
export function toHex(uint: Uint16Type): string {
  return `0x${uint.toString(16)}`;
}
