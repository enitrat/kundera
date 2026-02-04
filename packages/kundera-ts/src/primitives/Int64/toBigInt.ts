import type { Int64Type } from './types.js';

/**
 * Convert an Int64 to its bigint value.
 *
 * @param value - The Int64 to convert
 * @returns The signed bigint value
 */
export function toBigInt(value: Int64Type): bigint {
  return value as bigint;
}
