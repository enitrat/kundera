import type { Uint128Type } from './types.js';

/**
 * Convert Uint128 to bigint
 *
 * @param uint - Uint128 value
 * @returns bigint value
 */
export function toBigInt(uint: Uint128Type): bigint {
  return uint as bigint;
}
