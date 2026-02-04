import type { Int8Type } from './types.js';

/**
 * Convert an Int8 to its bigint value.
 *
 * @param value - The Int8 to convert
 * @returns The signed bigint value
 */
export function toBigInt(value: Int8Type): bigint {
  return value as bigint;
}
