import type { Uint256Type } from './types.js';

/**
 * Convert Uint256 to hex string
 *
 * @param uint - Uint256 value
 * @returns hex string with 0x prefix
 */
export function toHex(uint: Uint256Type): string {
  return '0x' + (uint as bigint).toString(16);
}
