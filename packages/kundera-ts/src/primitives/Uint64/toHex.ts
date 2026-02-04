import type { Uint64Type } from './types.js';

/**
 * Convert Uint64 to hex string
 *
 * @param uint - Uint64 value
 * @returns Hex string with 0x prefix
 */
export function toHex(uint: Uint64Type): string {
  return `0x${uint.toString(16)}`;
}
