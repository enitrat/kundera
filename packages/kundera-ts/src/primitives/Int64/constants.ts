/**
 * Minimum value for Int64: -2^63
 */
export const MIN = -(2n ** 63n);

/**
 * Maximum value for Int64: 2^63 - 1
 */
export const MAX = 2n ** 63n - 1n;

/**
 * Bit size of Int64
 */
export const SIZE = 64;

/**
 * Stark curve field prime: P = 2^251 + 17*2^192 + 1
 * Used for Cairo field encoding of negative values.
 */
export const PRIME = 2n ** 251n + 17n * 2n ** 192n + 1n;
