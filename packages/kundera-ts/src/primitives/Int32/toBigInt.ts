import type { Int32Type } from './types.js';

/**
 * Convert an Int32 to its bigint value.
 *
 * @param value - The Int32 to convert
 * @returns The signed bigint value
 */
export function toBigInt(value: Int32Type): bigint {
  return value as bigint;
}
