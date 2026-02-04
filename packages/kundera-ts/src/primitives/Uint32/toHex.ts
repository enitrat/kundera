import type { Uint32Type } from './types.js';

/**
 * Convert Uint32 to hex string
 *
 * @param uint - Uint32 value
 * @returns Hex string with 0x prefix
 */
export function toHex(uint: Uint32Type): string {
  return `0x${uint.toString(16)}`;
}
