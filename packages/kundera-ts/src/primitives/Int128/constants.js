/**
 * Minimum value for Int128: -2^127
 */
export const MIN = -(2n ** 127n);

/**
 * Maximum value for Int128: 2^127 - 1
 */
export const MAX = 2n ** 127n - 1n;

/**
 * Bit size of Int128
 */
export const SIZE = 128;

/**
 * Stark curve field prime: P = 2^251 + 17*2^192 + 1
 * Used for Cairo field encoding of negative values.
 */
export const PRIME = 2n ** 251n + 17n * 2n ** 192n + 1n;
