import type { Int16Type } from './types.js';

/**
 * Convert an Int16 to its bigint value.
 *
 * @param value - The Int16 to convert
 * @returns The signed bigint value
 */
export function toBigInt(value: Int16Type): bigint {
  return value as bigint;
}
