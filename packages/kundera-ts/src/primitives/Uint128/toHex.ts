import type { Uint128Type } from './types.js';

/**
 * Convert Uint128 to hex string
 *
 * @param uint - Uint128 value
 * @returns hex string with 0x prefix
 */
export function toHex(uint: Uint128Type): string {
  return '0x' + (uint as bigint).toString(16);
}
