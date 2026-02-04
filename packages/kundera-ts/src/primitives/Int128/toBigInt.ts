import type { Int128Type } from './types.js';

/**
 * Convert an Int128 to its bigint value.
 *
 * @param value - The Int128 to convert
 * @returns The signed bigint value
 */
export function toBigInt(value: Int128Type): bigint {
  return value as bigint;
}
