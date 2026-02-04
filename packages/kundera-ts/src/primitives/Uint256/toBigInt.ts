import type { Uint256Type } from './types.js';

/**
 * Convert Uint256 to bigint
 *
 * @param uint - Uint256 value
 * @returns bigint value
 */
export function toBigInt(uint: Uint256Type): bigint {
  return uint as bigint;
}
